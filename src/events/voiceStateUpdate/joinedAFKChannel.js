const CHANNEL_ID = "856973136850976849";
const { Client, VoiceState, EmbedBuilder } = require("discord.js");
const BasicEmbed = require("../../utils/BasicEmbed");

/**
 *
 * @param {VoiceState} oldState
 * @param {VoiceState} newState
 * @param {Client} client
 * @returns
 */
module.exports = async (oldState, newState, client) => {
  if (newState.channelId == null) return;
  if (newState.channelId != CHANNEL_ID) return;
  if (newState.channelId == oldState.channelId) return;

  const channel = newState.guild.channels.cache.get(CHANNEL_ID);
  const user = newState.member.user;

  disabledIds = ["234439833802637312", "343342321661902849"];

  if (disabledIds.includes(user.id)) return;

  // Dm the user

  const embed = new EmbedBuilder()
    .setTitle(":angry:")
    .setDescription("Why the fuck did you go afk HUH?\n\n**Fuck** You!")
    .setColor("Red")
    .setImage("https://media.tenor.com/FOm2IYJcr-EAAAAC/fuck-you-from-the-heart.gif");

  try {
    const message = await user.send({
      embeds: [embed],
    });

    setTimeout(() => {
      message.delete();
    }, 60000);
  } catch (error) {
    console.log("Failed to DM the user.");
  }
};
