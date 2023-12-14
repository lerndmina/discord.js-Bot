const { Schema, model } = require("mongoose");

const TagSchema = new Schema({
  key: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    required: true,
  },
});

module.exports = model("TagSchema", TagSchema);
