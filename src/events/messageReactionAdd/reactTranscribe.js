const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
  MessageType,
  MessageFlags,
  ActivityType,
  ChannelType,
} = require("discord.js");
var log = require("fancy-log");
const TranscribeMessage = require("../../utils/TranscribeMessage");
const FetchEnvs = require("../../utils/FetchEnvs");
const BasicEmbed = require("../../utils/BasicEmbed");
const DeleteMessage = require("../../utils/DeleteMessage");

const env = FetchEnvs();

var alreadyProcessed = false;

module.exports = async (reaction, user, client) => {
  if (reaction.partial) await reaction.fetch(); // Fetch the reaction
  const message = await reaction.message.fetch(); // Fetch the message

  if (user.bot) return;

  if (user.id != message.author.id) {
    reaction.users.remove(user.id);
    return;
  }

  if (message.flags != MessageFlags.IsVoiceMessage || message.attachments.size != 1) return;

  if (reaction.emoji.name != "✍️" && reaction.emoji.name != "❌") {
    reaction.users.remove(user.id);
    return;
  }

  // if a valid reacion has been added but the bot is not in the list of reactors, stop. As this means the bot has probably already processed the message.
  for (const [reactionString, reactionObj] of message.reactions.cache) {
    if (!reactionObj.me && (reactionString == "✍️" || reactionString == "❌")) {
      alreadyProcessed = true;
    }
  }

  if (alreadyProcessed) {
    const replyMsg = await message.reply({
      embeds: [BasicEmbed(client, "Error", "I've already processed this voice message.", "RED")],
    });

    DeleteMessage(replyMsg, 5000);
    return;
  }

  if (reaction.emoji.name == "❌") {
    await message.reactions.removeAll();
    return;
  }

  log(`[MESSAGE REACTION ADD] ${user.tag} reacted ${reaction.emoji} to a voice message.`);

  // If the reaction is ✍️ begin transcribing
  if (reaction.emoji.name == "✍️") {
    const resultBool = await TranscribeMessage(client, message, env.OPENAI_API_KEY);
    await message.reactions.removeAll();
    if (!resultBool) return;
    await message.react("✅");
  }
};
