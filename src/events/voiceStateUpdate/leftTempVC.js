const { Client } = require("discord.js");
var log = require("fancy-log");
const ActiveTempChannels = require("../../models/ActiveTempChannels");

module.exports = async (oldState, newState) => {
  if (oldState.channelId == null) return;
  leftChannelID = oldState.channelId;
  guildId = oldState.guild.id;

  // Check if the channel is a temp VC
  const vcList = await ActiveTempChannels.findOne({ guildID: guildId });

  if (!vcList) return;

  // Check if the channel is a temp VC

  const vc = vcList.channelIDs.find((vc) => vc === leftChannelID);
  if (!vc) return;

  log(`User left a temp VC: ${vc} in ${guildId} We will now attempt to delete it.`);

  const channel = oldState.guild.channels.cache.get(vc);

  if (!channel) {
    return;
  }

  try {
    await channel.delete();

    vcList.channelIDs = vcList.channelIDs.filter((vc) => vc !== leftChannelID);
    await vcList.save();

    log(`Deleted ${channel.name} as a temp vc.`);
  } catch (error) {
    log.error(error);
  }
};
