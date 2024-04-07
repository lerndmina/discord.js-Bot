import { InferSchemaType, Schema, model } from "mongoose";

const RemindersSchema = new Schema({
  botId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  reminderId: {
    type: String,
    required: true,
  },
  reminderText: {
    type: String,
    required: true,
  },
  reminderDate: {
    type: Date,
    required: true,
  },
});

export default model("Reminders", RemindersSchema);

export type RemindersType = InferSchemaType<typeof RemindersSchema>;
