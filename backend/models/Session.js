import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  sport: { type: mongoose.Schema.Types.ObjectId, ref: "Sport", required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teamPlayers: [{ type: String }],
  additionalPlayersNeeded: { type: Number, required: true },
  joinedPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  venue: { type: String, required: true },
  dateTime: { type: Date, required: true },
  status: { type: String, enum: ["active", "cancelled"], default: "active" },
  cancellationReason: { type: String }
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);
