const { Client, PresenceStatus, ChannelType, PermissionsBitField } = require("discord.js");
var log = require("fancy-log");
const GuildNewVC = require("../../models/GuildNewVC");
const ActiveTempChannels = require("../../models/ActiveTempChannels");
const BasicEmbed = require("../../utils/BasicEmbed");

/**
 *
 * @param {any} oldState
 * @param {any} newState
 * @param {Client} client
 * @returns
 */

module.exports = async (oldState, newState, client) => {
  if (newState.channelId == null) return;
  joinedChannelId = newState.channelId;
  guildId = newState.guild.id;

  const vcList = await GuildNewVC.findOne({ guildID: guildId });

  if (!vcList) return;

  const vc = vcList.guildChannelIDs.find((vc) => vc.channelID === joinedChannelId);

  if (!vc) return;

  const category = newState.guild.channels.cache.get(vc.categoryID);

  if (!category) {
    return;
  }

  const joinedChannel = newState.guild.channels.cache.get(joinedChannelId);
  const maxUsers = joinedChannel.userLimit;
  const bitrate = joinedChannel.bitrate;

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
      userLimit: maxUsers,
      bitrate: bitrate,
    });

    await newState.setChannel(newChannel);

    newChannel.send({
      content: `<@${newState.id}>`,
      embeds: [
        BasicEmbed(
          client,
          "Hello! 👋",
          `Welcome to your new channel! \n You can change the channel name and permissions by clicking the settings icon next to the channel name. \n Once the channel is empty, it will be deleted automatically.`,
          [{ name: "Is something wrong?", value: "Please DM `awild` on Discord.", inline: false }]
        ),
      ],
    });

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
  } catch (error) {
    log.error(error);
  }
};
