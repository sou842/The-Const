import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { getSessionFromRequest } from "@/lib/auth";

interface UpdateBody {
  role?: "admin" | "creator";
  status?: "active" | "inactive";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await req.json()) as UpdateBody;

    const nextRole = body.role;
    const nextStatus = body.status;

    if (!nextRole && !nextStatus) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    if (nextRole && !["admin", "creator"].includes(nextRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (nextStatus && !["active", "inactive"].includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await connectDB();

    const targetUser = await User.findById(id).select("_id role status");
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf = targetUser._id.toString() === session.userId;
    if (isSelf && nextStatus === "inactive") {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }

    if (targetUser.role === "admin" && nextRole === "creator") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot demote the last admin" }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};

    if (nextRole) {
      updateData.role = nextRole;
      updateData.access = {
        canApprove: nextRole === "admin",
        canAddBlog: true,
      };
    }

    if (nextStatus) {
      updateData.status = nextStatus;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("_id name email role status profilePhoto createdAt");

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
