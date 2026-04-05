import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Like } from "@/models/Like";
import { Comment } from "@/models/Comment";

type FeedParams = {
  page?: number;
  limit?: number;
  userId?: string | null;
};

type ExploreParams = {
  query?: string;
  category?: string;
  sort?: "latest" | "popular" | "trending";
};

void Like;
void Comment;

export async function getFeedBlogs({
  page = 1,
  limit = 20,
  userId,
}: FeedParams) {
  await connectDB();

  const skip = (page - 1) * limit;
  const userObjectId =
    userId && mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

  const blogs = await Blog.aggregate([
    { $match: { status: "approved" } },
    { $sort: { publishedDate: -1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "creatorData",
      },
    },
    { $unwind: { path: "$creatorData", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "likes",
        let: { blogId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$blogId", "$$blogId"] } } },
          { $count: "count" },
        ],
        as: "likesCount",
      },
    },
    {
      $lookup: {
        from: "comments",
        let: { blogId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$blogId", "$$blogId"] } } },
          { $count: "count" },
        ],
        as: "commentsCount",
      },
    },
    ...(userObjectId
      ? [
          {
            $lookup: {
              from: "likes",
              let: { blogId: "$_id", userId: userObjectId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$blogId", "$$blogId"] },
                        { $eq: ["$userId", "$$userId"] },
                      ],
                    },
                  },
                },
                { $limit: 1 },
                { $project: { _id: 1 } },
              ],
              as: "userLike",
            },
          },
        ]
      : []),
    {
      $addFields: {
        creator: {
          _id: "$creatorData._id",
          name: "$creatorData.name",
          username: "$creatorData.username",
          profilePhoto: "$creatorData.profilePhoto",
          profession: "$creatorData.profession",
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
                      cond: { $eq: ["$$block.type", "paragraph"] },
                    },
                  },
                  0,
                ],
              },
            },
            in: "$$firstPara.data.text",
          },
        },
        likeCount: { $ifNull: [{ $first: "$likesCount.count" }, 0] },
        commentCount: { $ifNull: [{ $first: "$commentsCount.count" }, 0] },
        isLikedByUser: userObjectId ? { $gt: [{ $size: "$userLike" }, 0] } : false,
      },
    },
    {
      $project: {
        body: 0,
        creatorData: 0,
        likesCount: 0,
        commentsCount: 0,
        userLike: 0,
      },
    },
  ]);

  const total = await Blog.countDocuments({ status: "approved" });
  return { blogs, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getExploreData({
  query = "",
  category = "",
  sort = "latest",
}: ExploreParams) {
  await connectDB();

  const filter: Record<string, unknown> = { status: "approved" };
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
    ];
  }
  if (category && category !== "All") {
    filter.category = category;
  }

  let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === "trending") sortOptions = { isTrending: -1, views: -1 };
  if (sort === "popular") sortOptions = { views: -1 };
  if (sort === "latest") sortOptions = { publishedDate: -1 };

  const [blogs, categories, latestBlogs] = await Promise.all([
    Blog.find(filter)
      .sort(sortOptions)
      .limit(20)
      .select("title author authorId category url thumbnail views createdAt publishedDate status tags")
      .populate("authorId", "name profilePhoto username profession")
      .lean(),
    Blog.distinct("category", { status: "approved" }),
    Blog.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("tags")
      .lean(),
  ]);

  const tagCounts: Record<string, number> = {};
  latestBlogs.forEach((blog) => {
    blog.tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const trendingTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, posts: count }));

  return { blogs, categories: ["All", ...categories], trendingTags };
}
