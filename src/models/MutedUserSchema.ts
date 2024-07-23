import { InferSchemaType, Schema, model } from "mongoose";

const MutedUserSchema = new Schema({
  userId: { type: String, required: true },
  guildID: { type: String, required: true },
  previousRoles: { type: Array, required: true },
  mutedUntil: { type: Date, required: true },
  mutedAt: { type: Date, required: true },
  mutedIndefinitely: { type: Boolean, required: true },
  reason: { type: String, required: true },
  moderator: { type: String, required: true },
  caseID: { type: String, required: true },
  currentlyMuted: { type: Boolean, required: true },
});

export default model("MutedUser", MutedUserSchema);

export type MutedUserType = InferSchemaType<typeof MutedUserSchema>;
