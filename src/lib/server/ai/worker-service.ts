import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Like } from '@/models/Like';
import { Comment } from '@/models/Comment';
import { AIConfig, IAIConfig } from '@/models/AIConfig';
import { generateWithMistral } from './mistral';

const SONU_ID = '69c9223054dfdaef41477c4d';
const ANIMESH_ID = '69c8d7e933df5c4a4a7cee2c';

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
      schedule: { postsPerDay: 3, activeHours: "10AM - 11PM" }
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
      schedule: { postsPerDay: 2, activeHours: "9AM - 6PM" }
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

async function shouldPost(config: IAIConfig, force: boolean = false): Promise<boolean> {
  if (force) return true;
  
  const now = new Date();
  const { postsToday, lastPostAt } = config.metrics;
  const { postsPerDay } = config.schedule;

  // Basic limit check
  if (postsToday >= postsPerDay) return false;

  // Space out posts (min 3 hours)
  if (lastPostAt && (now.getTime() - lastPostAt.getTime()) < 3 * 60 * 60 * 1000) {
    return false;
  }

  // Randomness: 20% chance to post in this run if we haven't reached the limit
  return Math.random() < 0.2;
}

async function generateAndSavePost(config: IAIConfig) {
  const user = await User.findById(config.userId);
  if (!user) return;

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

    Rule:
    - Do NOT use em dashes (—) in the entire post.
    - Use a comma, period, or rewrite the sentence.
  `;

  try {
    const rawResponse = await generateWithMistral(prompt);
    
    // Robust JSON extraction
    const startIdx = rawResponse.indexOf('{');
    const endIdx = rawResponse.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
      throw new Error(`No JSON block found in response: ${rawResponse.substring(0, 100)}...`);
    }

    const jsonStr = rawResponse.substring(startIdx, endIdx + 1);
    const { title, content, thumbnail_title, thumbnail_description, tags } = JSON.parse(jsonStr);

    const blog = new Blog({
      title,
      body: [], // quick_posts have empty body array
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
        description: content // The main post content goes here for quick_posts
      },
      publishedDate: new Date()
    });

    await blog.save();
    
    // Update metrics
    config.metrics.lastPostAt = new Date();
    config.metrics.postsToday += 1;
    config.metrics.totalPosts += 1;
    await config.save();

    console.log(`Post created by ${config.personality.name}: ${title}`);
  } catch (err) {
    console.error(`Failed to generate post for ${config.personality.name}:`, err);
  }
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
      config.metrics.totalLikes += 1;
      likesCount++;
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
          await Comment.create({
            blogId: blog._id,
            userId: config.userId,
            author: config.personality.name,
            body: commentText,
            status: 'approved'
          });
          config.metrics.totalComments += 1;
          commentsCount++;
          console.log(`${config.personality.name} commented on: ${blog.title}`);
        } catch (err) {
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

  // Process posting
  if (await shouldPost(config, force)) {
    await generateAndSavePost(config);
  }

  // Process engagement
  await processEngagement(config);

  config.metrics.lastActiveAt = new Date();
  await config.save();
}

export async function runAIWorker() {
  await connectDB();
  await initializeAIConfigs();
  
  const activeConfigs = await AIConfig.find({ status: 'active' });
  for (const config of activeConfigs) {
    // Using simple for-loop to avoid hitting API rate limits too fast (sequential execution)
    await runAIWorkerForUser(config.userId.toString());
  }
}
