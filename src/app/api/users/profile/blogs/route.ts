import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
import { getSessionFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

// GET - Fetch all blogs authored by the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Find all blogs where authorId matches the current user, omitting body but keeping preview
    const blogs = await Blog.aggregate([
      { $match: { authorId: new mongoose.Types.ObjectId(session.userId) } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
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
          }
        }
      },
      {
        $project: {
          body: 0
        }
      }
    ]);

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error("Fetch user blogs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
