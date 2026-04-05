import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Like } from "@/models/Like"; // Importing ensures Mongoose registers the model for aggregation $lookups
import { getSessionFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

// GET - Fetch all approved blogs for the feed
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionFromRequest(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const blogs = await Blog.aggregate([
      { $match: { status: "approved" } },
      { $sort: { publishedDate: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      // Join author info
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "creatorData"
        }
      },
      {
        $unwind: {
          path: "$creatorData",
          preserveNullAndEmptyArrays: true
        }
      },
      // Join like count from the likes collection
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "blogId",
          as: "likesData"
        }
      },
      // Join comment count from the comments collection
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "blogId",
          as: "commentsData"
        }
      },
      {
        $addFields: {
          creator: {
            _id: "$creatorData._id",
            name: "$creatorData.name",
            username: "$creatorData.username",
            profilePhoto: "$creatorData.profilePhoto",
            profession: "$creatorData.profession"
          },
          previewText: {
            $let: {
              vars: {
                firstPara: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: { $ifNull: ["$body", []] },
                        as: "block",
                        cond: { $eq: ["$$block.type", "paragraph"] }
                      }
                    },
                    0
                  ]
                }
              },
              in: "$$firstPara.data.text"
            }
          },
          likeCount: { $size: "$likesData" },
          commentCount: { $size: "$commentsData" },
          // isLikedByUser: true if the auth user's ObjectId exists in the likes array
          isLikedByUser: session?.userId
            ? {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$likesData",
                        as: "l",
                        cond: {
                          $eq: ["$$l.userId", new mongoose.Types.ObjectId(session.userId)]
                        }
                      }
                    }
                  },
                  0
                ]
              }
            : false
        }
      },
      {
        $project: {
          body: 0, // Discard full body — save bandwidth
          creatorData: 0,
          likesData: 0,
          commentsData: 0,
        }
      }
    ]);

    const total = await Blog.countDocuments({ status: "approved" });

    return NextResponse.json({ blogs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Fetch blogs error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Create a new blog (auth required)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { title, content, category, tags, thumbnail, language, url, contentType } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Title, content, and category are required" }, { status: 400 });
    }

    const blog = new Blog({
      title,
      body: content,
      thumbnail: thumbnail || {},
      category,
      tags: tags || [],
      author: session.name,
      authorId: session.userId,
      publishedDate: new Date(),
      status: "pending",
      editorType: "EDITORJS",
      language: language || "en",
      url: url || "", // generation handled by hook if empty
      contentType: contentType || "blog",
    });

    await blog.save();

    return NextResponse.json({ message: "Blog created successfully", blog }, { status: 201 });
  } catch (error) {
    console.error("Create blog error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
