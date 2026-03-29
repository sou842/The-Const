import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
import mongoose from "mongoose";

// GET - Retrieve all approved blogs for a specific user ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    // Use aggregation to provide consistent feed output (e.g., previewText)
    const userId = new mongoose.Types.ObjectId(id);

    const blogs = await Blog.aggregate([
      { $match: { authorId: userId, status: "approved" } },
      { $sort: { publishedDate: -1, createdAt: -1 } },
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
    console.error("Public user blogs retrieval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
