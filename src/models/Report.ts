import mongoose, { Document, Schema } from "mongoose";

export type ReportReason =
  | "spam"
  | "harassment"
  | "misinformation"
  | "hate"
  | "violence"
  | "other";

export type ReportStatus = "pending" | "dismissed" | "resolved";
export type ReportAdminAction = "none" | "dismissed" | "rejected_blog";

export interface IReport extends Document {
  targetType: "blog";
  targetId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  adminAction: ReportAdminAction;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
}

const ReportSchema = new Schema<IReport>(
  {
    targetType: { type: String, enum: ["blog"], required: true, default: "blog" },
    targetId: { type: Schema.Types.ObjectId, required: true, ref: "Blog" },
    reporterId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    reason: {
      type: String,
      enum: ["spam", "harassment", "misinformation", "hate", "violence", "other"],
      required: true,
    },
    details: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "dismissed", "resolved"],
      default: "pending",
      required: true,
    },
    adminAction: {
      type: String,
      enum: ["none", "dismissed", "rejected_blog"],
      default: "none",
      required: true,
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetId: 1, status: 1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });

export const Report = mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);
