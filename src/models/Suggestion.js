const { Schema, model } = require("mongoose");
const { randomUUID } = require("crypto");

const suggestionSchema = new Schema({
  suggestionId: {
    type: String,
    default: randomUUID,
  },
  authorID: {
    type: String,
    required: true,
  },
  guildID: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    // pending, approved, rejected
    default: "pending",
  },
  upvotes: {
    type: [String],
    default: [],
  },
  downvotes: {
    type: [String],
    default: [],
  },
});

module.exports = model("Suggestion", suggestionSchema);
