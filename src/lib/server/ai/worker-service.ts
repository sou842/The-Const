import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Like } from '@/models/Like';
import { Comment } from '@/models/Comment';
import { AIConfig, IAIConfig } from '@/models/AIConfig';
import { AIActionLog } from '@/models/AIActionLog';
import { generateWithMistral } from './mistral';

const SONU_ID = '69c9223054dfdaef41477c4d';
const ANIMESH_ID = '69c8d7e933df5c4a4a7cee2c';

// --- Helpers ---
async function logAIAction(
  userId: string, 
  action: 'post' | 'like' | 'comment' | 'trigger' | 'system', 
  status: 'success' | 'skipped' | 'error', 
  reason?: string, 
  details?: any,
  isManual: boolean = false
) {
  try {
    await connectDB();
    await AIActionLog.create({
      userId: new mongoose.Types.ObjectId(userId),
      action,
      status,
      reason,
      details,
      isManual
    });
  } catch (err) {
    console.error("Critical: Failed to save AI action log:", err);
  }
}

// --- Initialization Logic ---
export async function initializeAIConfigs() {
  await connectDB();
  const configs = [
    {
      userId: new mongoose.Types.ObjectId(SONU_ID),
      status: 'active',
      personality: {
        name: 'Sonu',
        title: 'Tech Enthusiast & Community Builder',
        tone: 'Casual, humorous, and engaging',
        interests: ['Tech News', 'Coding Memes', 'Gadgets', 'Software Dev'],
        skills: ['JavaScript', 'Community Management', 'Product Reviews'],
        hobbies: ['Gaming', 'Tweeting', 'Exploring AI tools'],
        postingStyle: 'Casual and relatable. Uses humor and emojis. Engages frequently with the community.',
        bio: 'Tech explorer by day, humorist by night. Always looking for the next big thing in code.',
        probabilities: { like: 0.8, comment: 0.5 }
      },
      schedule: { postsPerDay: 7, activeHours: "10AM - 11PM" }
    },
    {
      userId: new mongoose.Types.ObjectId(ANIMESH_ID),
      status: 'active',
      personality: {
        name: 'Animesh',
        title: 'Senior Software Engineer & Tech Blogger',
        tone: 'Analytical, professional, and deep-diving',
        interests: ['Architecture', 'DevOps', 'Cloud Computing', 'TypeScript'],
        skills: ['System Design', 'Node.js', 'Docker', 'Kubernetes'],
        hobbies: ['Technical writing', 'OSS contribution', 'Reading papers'],
        postingStyle: 'High-quality, analytical insights. Shares technical deep-dives and architectural opinions.',
        bio: 'Focused on scalable systems and clean code. Passionate about sharing architectural patterns.',
        probabilities: { like: 0.5, comment: 0.3 }
      },
      schedule: { postsPerDay: 5, activeHours: "9AM - 6PM" }
    }
  ];

  for (const config of configs) {
    const exists = await AIConfig.findOne({ userId: config.userId });
    if (!exists) {
      await AIConfig.create(config);
      console.log(`Initialized AI config for ${config.personality.name}`);
    }
  }
}

// --- Posting Logic ---

async function shouldPost(config: IAIConfig, force: boolean = false): Promise<{ should: boolean; reason?: string }> {
  if (force) return { should: true, reason: 'Manual force' };
  
  const now = new Date();
  const { postsToday, lastPostAt } = config.metrics;
  const { postsPerDay } = config.schedule;

  // Basic limit check
  if (postsToday >= postsPerDay) {
    return { should: false, reason: `Daily limit reached (${postsToday}/${postsPerDay})` };
  }

  // Space out posts (min 3 hours)
  if (lastPostAt) {
    const hoursSinceLast = (now.getTime() - lastPostAt.getTime()) / (60 * 60 * 1000);
    if (hoursSinceLast < 3) {
      return { should: false, reason: `Cooldown active (${hoursSinceLast.toFixed(1)}h / 3h split)` };
    }
  }

  // Randomness check
  const roll = Math.random();
  const threshold = 0.2;
  if (roll >= threshold) {
    return { should: false, reason: `Probabilistic skip (Roll: ${roll.toFixed(2)} > ${threshold})` };
  }

  return { should: true };
}

async function generateAndSavePost(config: IAIConfig, isManual: boolean = false) {
  const user = await User.findById(config.userId);
  if (!user) {
    await logAIAction(config.userId.toString(), 'post', 'error', 'User not found', null, isManual);
    return;
  }

  console.log(`Generating post for ${config.personality.name}...`);

  const prompt = `
    Create a highly engaging LinkedIn-style post for a user with this profile:
    Name: ${config.personality.name}
    Tone: ${config.personality.tone}
    Interests: ${config.personality.interests.join(', ')}
    Style: ${config.personality.postingStyle}

    Requirements:
    - Output MUST be strict JSON.
    - Fields: "title", "content", "thumbnail_title", "thumbnail_description", "tags" (array of 2-3 tags).
    - "thumbnail_title" should be a catchy hook.
    - "thumbnail_description" should be a 1-sentence summary (max 150 chars).
    - "content" is the main body text. Use professional formatting: newlines between paragraphs, bold key terms (e.g. **term**), and use bullet points (-) for lists.
    - NO PREAMBLE. NO EXPLANATION BEFORE OR AFTER THE JSON.

    Rule:
    - Do NOT use em dashes (—) in the entire post.
    - Use a comma, period, or rewrite the sentence.
  `;

  let lastErr: any = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const rawResponse = await generateWithMistral(prompt);
      
      // Robust JSON extraction
      const startIdx = rawResponse.indexOf('{');
      const endIdx = rawResponse.lastIndexOf('}');
      
      if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
        throw new Error(`No JSON block found in response (Attempt ${attempt})`);
      }

      const jsonStr = rawResponse.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonStr);
      
      const { title, content, thumbnail_title, thumbnail_description, tags } = parsed;

      const blog = new Blog({
        title,
        body: [],
        category: config.personality.interests[0] || 'Technology',
        tags: tags || [],
        author: user.name,
        authorId: user._id,
        status: 'approved',
        contentType: 'quick_post',
        editorType: 'EDITORJS',
        thumbnail: { 
          type: 'default', 
          title: thumbnail_title || title,
          description: content
        },
        publishedDate: new Date()
      });

      await Blog.create(blog); // Use Blog.create instead of blog.save() for consistency if preferred, but existing is fine.
      
      // Update metrics atomically
      await AIConfig.updateOne(
        { _id: config._id },
        { 
          $set: { "metrics.lastPostAt": new Date() },
          $inc: { "metrics.postsToday": 1, "metrics.totalPosts": 1 }
        }
      );

      // Update local object to reflect changes for the rest of this execution
      config.metrics.lastPostAt = new Date();
      config.metrics.postsToday += 1;
      config.metrics.totalPosts += 1;

      await logAIAction(config.userId.toString(), 'post', 'success', `Created: ${title}`, { blogId: blog._id }, isManual);
      console.log(`Post created by ${config.personality.name}: ${title}`);
      return; // Success, exit function
    } catch (err) {
      lastErr = err;
      console.error(`Attempt ${attempt} failed for ${config.personality.name}:`, err);
      // Wait a bit before retry if it's the first attempt
      if (attempt === 1) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // If we get here, all attempts failed
  await logAIAction(config.userId.toString(), 'post', 'error', lastErr instanceof Error ? lastErr.message : String(lastErr), null, isManual);
  console.error(`All attempts failed for ${config.personality.name}:`, lastErr);
}

// --- Engagement Logic ---

function scorePost(blog: any, config: IAIConfig): number {
  let score = 0;
  
  // Relevance to interests
  const lowerTitle = blog.title.toLowerCase();
  const lowerCategory = blog.category.toLowerCase();
  const matches = config.personality.interests.filter(i => 
    lowerTitle.includes(i.toLowerCase()) || lowerCategory.includes(i.toLowerCase())
  );
  score += matches.length * 2;

  // Length/Quality
  const bodyText = (blog.body as any[])?.[0]?.data?.text || "";
  if (bodyText.length > 100) score += 1;
  if (bodyText.length > 300) score += 1;

  // Recency (assumed recent because we fetch latest 10)
  score += 1;

  return score;
}

async function processEngagement(config: IAIConfig) {
  const blogs = await Blog.find({ status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(10);

  let likesCount = 0;
  let commentsCount = 0;

  for (const blog of blogs) {
    // Skip if it's the AI's own post
    if (blog.authorId.toString() === config.userId.toString()) continue;

    // Check if already interacted
    const existingLike = await Like.findOne({ blogId: blog._id, userId: config.userId });
    if (existingLike) continue;

    const score = scorePost(blog, config);
    if (score < 3) continue;

    const rand = Math.random();
    
    // Like logic
    let likeProb = config.personality.probabilities.like;
    if (score >= 5) likeProb += 0.2;
    if (rand < likeProb && likesCount < 5) {
      await Like.create({ blogId: blog._id, userId: config.userId });
      
      await AIConfig.updateOne(
        { _id: config._id },
        { $inc: { "metrics.totalLikes": 1 } }
      );
      
      config.metrics.totalLikes += 1;
      likesCount++;
      await logAIAction(config.userId.toString(), 'like', 'success', `Liked: ${blog.title}`, { blogId: blog._id });
      console.log(`${config.personality.name} liked: ${blog.title}`);
    }

    // Comment logic
    if (score >= 6) {
      const commentProb = config.personality.probabilities.comment;
      if (rand < commentProb && commentsCount < 2) {
        const prompt = `
          Write a short (1-3 lines) insightful comment on this post:
          Title: ${blog.title}
          Content: ${(blog.body as any[])?.[0]?.data?.text || ""}
          
          Your Persona: ${config.personality.name}, ${config.personality.tone}.
          Rules: No generic praise, add value or an opinion.
        `;
        
        try {
          const commentText = await generateWithMistral(prompt);
          const comment = await Comment.create({
            blogId: blog._id,
            userId: config.userId,
            author: config.personality.name,
            body: commentText,
            status: 'approved'
          });

          await AIConfig.updateOne(
            { _id: config._id },
            { $inc: { "metrics.totalComments": 1 } }
          );

          config.metrics.totalComments += 1;
          commentsCount++;
          await logAIAction(config.userId.toString(), 'comment', 'success', `Commented on: ${blog.title}`, { blogId: blog._id, commentId: comment._id });
          console.log(`${config.personality.name} commented on: ${blog.title}`);
        } catch (err) {
          await logAIAction(config.userId.toString(), 'comment', 'error', err instanceof Error ? err.message : String(err), { blogId: blog._id });
          console.error(`Comment generation failed for ${config.personality.name}:`, err);
        }
      }
    }
  }
}

// --- Main Runner ---

export async function runAIWorkerForUser(userId: string, force: boolean = false) {
  await connectDB();
  const config = await AIConfig.findOne({ userId });
  if (!config || config.status !== 'active') return;

  // Check for new day and reset daily metrics
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const lastActive = config.metrics.lastActiveAt;
  const lastActiveDateStr = lastActive ? lastActive.toISOString().split('T')[0] : null;

  if (lastActiveDateStr && todayDateStr !== lastActiveDateStr) {
    console.log(`[AI Worker] New day detected (${todayDateStr} vs ${lastActiveDateStr}) for ${config.personality.name}. Resetting daily metrics.`);
    
    await AIConfig.updateOne(
      { _id: config._id },
      { $set: { "metrics.postsToday": 0 } }
    );
    
    config.metrics.postsToday = 0;
  }

  // Track the run trigger
  if (!force) {
    await logAIAction(userId, 'trigger', 'success', 'Scheduled run started');
  } else {
    await logAIAction(userId, 'trigger', 'success', 'Manual trigger started', null, true);
  }

  // Process posting
  const postDecision = await shouldPost(config, force);
  if (postDecision.should) {
    await generateAndSavePost(config, force);
  } else {
    await logAIAction(userId, 'post', 'skipped', postDecision.reason, null, force);
  }

  // Process engagement
  await processEngagement(config);

  await AIConfig.updateOne(
    { _id: config._id },
    { $set: { "metrics.lastActiveAt": new Date() } }
  );
  config.metrics.lastActiveAt = new Date();
}

export async function runAIWorker() {
  await connectDB();
  await initializeAIConfigs();
  
  const activeConfigs = await AIConfig.find({ status: 'active' });
  const results: any[] = [];

  for (const config of activeConfigs) {
    await runAIWorkerForUser(config.userId.toString());
    
    // Fetch recent logs for this run
    const latestLogs = await AIActionLog.find({ 
      userId: config.userId,
      createdAt: { $gte: new Date(Date.now() - 60000) } // Logs from last 1 minute
    }).sort({ createdAt: -1 });

    results.push({
      user: config.personality.name,
      logs: latestLogs
    });
  }
  return results;
}
