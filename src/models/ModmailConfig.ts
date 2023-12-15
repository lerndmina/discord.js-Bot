const { Schema, model } = require("mongoose");

const ModmailConfig = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  forumChannelId: {
    type: String,
    required: true,
  },
  staffRoleId: {
    type: String,
    required: true,
  },
});

module.exports = model("ModmailConfig", ModmailConfig);
