const { MessageType, MessageFlags, ActivityType } = require("discord.js");
var log = require("fancy-log");
const onMention = require("../../utils/onMention");
const syncCommands = require("../../utils/unregister-commands");
const TranscribeMessage = require("../../utils/TranscribeMessage");
const BasicEmbed = require("../../utils/BasicEmbed");

const env = require("../../utils/FetchEnvs")();

const BANNED_GUILDS = ["856937743543304203"];

module.exports = async (message, client) => {
  if (BANNED_GUILDS.includes(message.guildId)) return;

  if (message.author.bot) return;

  if (message.content.includes(`${env.PREFIX}embed`)) {
    message.reply({
      embeds: [
        BasicEmbed(client, "Basic Embed", message.content, [
          { name: "Hello", value: "world", inline: true },
          { name: "Hello", value: "world", inline: true },
        ]),
      ],
    });
  }

  // Unync commmand
  if (message.content.startsWith(`${env.PREFIX}unsync`)) {
    if (!env.OWNER_IDS.includes(message.author.id)) return;
    if (message.content.includes("global")) {
      syncCommands(client, message, message.guildId, true);
      return true;
    }
    syncCommands(client, message, message.guildId, false);
    return true;
  }

  // Reboot command
  if (message.content == `${env.PREFIX}reboot`) {
    if (!env.OWNER_IDS.includes(message.author.id)) return;
    await message.reply({
      embeds: [BasicEmbed(client, "Reboot", "Rebooting...")],
    });
    log("Rebooting...");

    // Set offline
    client.user.setActivity("my own death.", { type: ActivityType.Watching });
    client.user.setStatus("dnd");

    // Cleanly log out of Discord
    await client.destroy();
    process.exit(0);
  }

  if (message.type == MessageType.Reply) {
    const channel = message.channel;
    const repliedMessage = await channel.messages.fetch(message.reference.messageId);
    if (repliedMessage.author.id != client.user.id) return;
    onMention(client, message, env.OPENAI_API_KEY);
    return true;
  }
  if (message.content.includes(client.user.id)) {
    onMention(client, message, env.OPENAI_API_KEY);
    return true;
  }

  if (message.flags == MessageFlags.IsVoiceMessage && message.attachments.size == 1) {
    if (message.reactions.cache.size > 0) return;
    message.react("✍️").then(() => message.react("❌"));
  }
};
