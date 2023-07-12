const { Client, Collection, Events, GatewayIntentBits, Partials, MessageType, MessageFlags, ActivityType, ChannelType } = require("discord.js");
var log = require("fancy-log");
const fs = require("fs");
const path = require("node:path");
const onMention = require("./onMention");
const ready = require("./ready");
const syncCommands = require("../utils/register-commands");
const TranscribeMessage = require("../utils/TranscribeMessage");
const DeleteMessage = require("../utils/DeleteMessage");
const { args } = require("fluent-ffmpeg/lib/utils");
const BasicEmbed = require("../utils/BasicEmbed");
const onMessage = require("./onMessage");

require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;
const PREFIX = process.env.PREFIX;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const BANNED_GUILDS = ["856937743543304203"];

module.exports = async (client, message) => {
  if (BANNED_GUILDS.includes(message.guildId)) return;

  if (message.author.bot) return;

  if (message.content.includes(`${PREFIX}embed`)) {
    message.reply({
      embeds: [
        BasicEmbed(client, "Basic Embed", message.content, [
          { name: "Hello", value: "world", inline: true },
          { name: "Hello", value: "world", inline: true },
        ]),
      ],
    });
  }

  if (message.content.startsWith(`${PREFIX}sync`)) {
    if (message.author.id != OWNER_ID) return;

    var args = message.content.slice(PREFIX.length).trim().split(/ +/);
    args.shift().toLowerCase();
    if (args.length > 1) {
      await message.reply({ embeds: [BasicEmbed(client, "Sync Commands", "Invalid arguments.", [{ name: "Usage", value: `${PREFIX}sync [guildId]` }])] });
      return;
    }

    if (args.length == 0) {
      syncCommands(client, message, message.guildId);
      return;
    }

    if (args[0] == "clean") {
      syncCommands(client, message, message.guildId, true);
      return;
    }

    var guildId = args[0];
    var guild = await client.guilds.cache.get(guildId);

    if (!guild) {
      await message.reply({ embeds: [BasicEmbed(client, "Sync Commands", "Invalid guild id.", [{ name: "Usage", value: `${PREFIX}sync [guildId]` }])] });
      return;
    }
    syncCommands(client, message, guildId);

    // Done
  } else if (message.content == `${PREFIX}reboot`) {
    if (message.author.id != OWNER_ID) return;
    await message.reply({ embeds: [BasicEmbed(client, "Reboot", "Rebooting...")] });
    log("Rebooting...");

    // Set offline
    client.user.setActivity("my own death.", { type: ActivityType.Watching });
    client.user.setStatus("dnd");

    // Cleanly log out of Discord
    await client.destroy();
    process.exit(0);
  } else if (message.type == MessageType.Reply) {
    const channel = message.channel;
    const repliedMessage = await channel.messages.fetch(message.reference.messageId);
    if (repliedMessage.author.id == client.user.id) {
      onMention(client, message, OPENAI_API_KEY);
    }
  } else if (message.content.includes(client.user.id)) {
    onMention(client, message, OPENAI_API_KEY);
  } else if (message.flags == MessageFlags.IsVoiceMessage && message.attachments.size == 1) {
    // if message has reactions then return
    if (message.reactions.cache.size > 0) return;

    // if message has no reactions then react with ✍️ and ❌
    if (message.reactions.cache.size == 0) {
      message.react("✍️");
      TranscribeMessage(client, message, OPENAI_API_KEY);
    }
  }
};
