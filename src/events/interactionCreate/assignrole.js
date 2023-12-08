const {
  ButtonInteraction,
  Client,
  InteractionType,
  MessageComponentInteraction,
  DiscordjsError,
} = require("discord.js");
const RoleButtons = require("../../models/RoleButtons");
const { log } = require("console");

/**
 *
 * @param {MessageComponentInteraction} interaction
 * @param {Client} client
 */
module.exports = async (interaction, client) => {
  if (interaction.type !== InteractionType.MessageComponent) return;
  if (!interaction.guild) return;
  if (!interaction.customId.startsWith("roleGive-")) return;

  const parts = interaction.customId.split("-");
  const uuid = parts.slice(1).join("-");
  const roleObj = await RoleButtons.findOne({ buttonId: uuid });
  if (!roleObj)
    return interaction.reply({
      content: `This button is broken. Please contact the bot developer.\nPlease provide a screenshot of this message\n\`No Role Object Found For ${uuid}\``,
      ephemeral: true,
    });

  const role = interaction.guild.roles.cache.get(roleObj.roleId);
  if (!role)
    return interaction.reply({
      content: `This button is broken. Please contact the bot developer.\nPlease provide a screenshot of this message\n\`No Role Found For ${roleObj.roleId}\``,
      ephemeral: true,
    });

  try {
    const member = interaction.member;
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      return interaction.reply({
        content: `Removed <@&${role.id}> from <@${member.id}>`,
        ephemeral: true,
      });
    }
    await member.roles.add(role);
    return interaction.reply({
      content: `Added <@&${role.id}> to <@${member.id}>`,
      ephemeral: true,
    });
  } catch (error) {
    if (error.code == 50013) {
      return interaction.reply({
        content: `I don't have permission to give you that role. Please contact the server staff. This is not an error with the bot.`,
        ephemeral: true,
      });
    } else {
      return interaction.reply({
        content: `An error occurred. Please contact the bot developer.\nPlease provide a screenshot of this message\n\`${error.code}\``,
        ephemeral: true,
      });
    }
  }
};
