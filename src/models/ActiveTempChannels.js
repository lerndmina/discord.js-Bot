const { Schema, model } = require("mongoose");

const ActiveTempChannels = new Schema({
  guildID: {
    type: String,
    required: true,
  },
  channelIDs: {
    type: [String],
    default: [],
  },
});

module.exports = model("ActiveTempChannels", ActiveTempChannels);
