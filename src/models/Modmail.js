const { Schema, model } = require("mongoose");

const Modmail = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  forumThreadId: {
    type: String,
    required: true,
  },
  forumChannelId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  webhookId: {
    type: String,
    required: true,
  },
  webhookToken: {
    type: String,
    required: true,
  },
});

module.exports = model("Modmail", Modmail);
