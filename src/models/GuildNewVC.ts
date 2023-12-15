
const { Schema, model } = require("mongoose");

const GuildNewVc = new Schema({
  guildID: {
    type: String,
    required: true,
  },
  guildChannelIDs: {
    type: [
      {
        channelID: String,
        categoryID: String,
      },
    ],
    default: {},
  },
});

module.exports = model("GuildNewVC", GuildNewVc);
