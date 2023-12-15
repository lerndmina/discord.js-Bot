const { Schema, model } = require("mongoose");

const RoleButtons = new Schema({
  buttonId: {
    type: String,
    required: true,
    unique: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  roleId: {
    type: String,
    required: true,
  },
});

module.exports = model("RoleButtons", RoleButtons);
