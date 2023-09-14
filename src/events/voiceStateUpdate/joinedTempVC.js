const { Client, PresenceStatus, ChannelType, PermissionsBitField } = require("discord.js");
var log = require("fancy-log");
const GuildNewVC = require("../../models/GuildNewVC");
const ActiveTempChannels = require("../../models/ActiveTempChannels");

module.exports = async (oldState, newState) => {
  if (newState.channelId == null) return;
  joinedChannelId = newState.channelId;
  guildId = newState.guild.id;

  // Check if the channel is a temp VC
  const vcList = await GuildNewVC.findOne({ guildID: guildId });

  if (!vcList) return;

  // Check if the channel is a temp VC

  const vc = vcList.guildChannelIDs.find((vc) => vc.channelID === joinedChannelId);

  if (!vc) return;

  const category = newState.guild.channels.cache.get(vc.categoryID);

  if (!category) {
    return;
  }

  try {
    var newChannel = await newState.guild.channels.create({
      name: `${newState.member.displayName}'s Channel`,
      type: ChannelType.GuildVoice,
      parent: category.id,
      permissionOverwrites: [
        {
          id: newState.member.id,
          allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles],
        },
      ],
    });

    await newState.setChannel(newChannel);

    const tempList = await ActiveTempChannels.findOne({ guildID: guildId });

    if (tempList) {
      tempList.channelIDs.push(newChannel.id);
      await tempList.save();
    } else {
      const newTempList = new ActiveTempChannels({
        guildID: newChannel.guild.id,
        channelIDs: [newChannel.id],
      });
      await newTempList.save();
    }

    log(`Registered ${newChannel.name} as a temp vc.`);
  } catch (error) {
    log.error(error);
  }
};
