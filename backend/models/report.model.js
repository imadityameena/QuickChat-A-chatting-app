import mongoose from "mongoose";

export const REPORT_REASONS = ["spam", "harassment", "inappropriate", "impersonation", "underage", "other"];

// A user reporting another user. Reviewed by hand (e.g. in MongoDB Atlas).
const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reported: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reported: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
