const { Schema, model } = require("mongoose");

const DontAtMeRole = new Schema({
  roleId: {
    type: String,
    required: true,
    unique: true,
  },
  guildId: {
    type: String,
    required: true,
  },
});

module.exports = model("DontAtMeRole", DontAtMeRole);
