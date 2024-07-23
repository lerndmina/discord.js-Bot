import { InferSchemaType, Schema, model } from "mongoose";

const MuteRoleSchema = new Schema({
  guildID: { type: String, required: true },
  roleID: { type: String, required: true },
});

export default model("MuteRole", MuteRoleSchema);

export type MuteRoleType = InferSchemaType<typeof MuteRoleSchema>;
