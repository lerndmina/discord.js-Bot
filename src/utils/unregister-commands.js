const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
var log = require("fancy-log");
const DeleteMessage = require("./DeleteMessage");
const BasicEmbed = require("./BasicEmbed");

require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;

const syncCommands = async (client, message, guildId, global) => {
  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(BOT_TOKEN);

  if (!global) {
    try {
      await message.channel.send("Deleting this guild's commands...");
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: [] });
      await message.channel.send("Guild's commands deleted.");
      return;
    } catch (error) {
      log.error(error);
      await message.channel.send("Error deleting commands.");
      return;
    }
  } else {
    try {
      await message.channel.send("Deleting global commands...");
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
      await message.channel.send("Global commands deleted.");
      return;
    } catch (error) {
      log.error(error);
      await message.channel.send("Error deleting commands.");
      return;
    }
  }
};

module.exports = syncCommands;
