const {
  ButtonInteraction,
  Client,
  InteractionType,
  MessageComponentInteraction,
  DiscordjsError,
} = require("discord.js");
const RoleButtons = require("../../models/RoleButtons");
const { log } = require("console");
const { ROLE_BUTTON_PREFIX, waitingEmoji } = require("../../Bot");
const { Database } = require("../../utils/cache/database");
const { debugMsg } = require("../../utils/TinyUtils");
const env = require("../../utils/FetchEnvs")();

/**
 *
 * @param {MessageComponentInteraction} interaction
 * @param {Client} client
 */
module.exports = async (interaction, client) => {
  var start = env.DEBUG_LOG ? Date.now() : undefined;
  if (interaction.type !== InteractionType.MessageComponent) return;
  if (!interaction.guild) return;
  if (!interaction.customId.startsWith(ROLE_BUTTON_PREFIX)) return;
  await interaction.reply({ content: waitingEmoji, ephemeral: true });

  const parts = interaction.customId.split("-");
  const uuid = parts.slice(1).join("-");
  const db = new Database();
  const roleObj = await db.findOne(RoleButtons, { buttonId: uuid });
  if (!roleObj)
    return interaction.editReply({
      content: `This button is broken. Please contact the bot developer.\nPlease provide a screenshot of this message\n\`No Role Object Found For ${uuid}\``,
      ephemeral: true,
    });

  const role = interaction.guild.roles.cache.get(roleObj.roleId);
  if (!role)
    return interaction.editReply({
      content: `This button is broken. Please contact the bot developer.\nPlease provide a screenshot of this message\n\`No Role Found For ${roleObj.roleId}\``,
      ephemeral: true,
    });

  try {
    const member = interaction.member;
    if (member.roles.cache.has(role.id)) {
      member.roles.remove(role);
      if (env.DEBUG_LOG) debugMsg(`Time taken: ${Date.now() - start}ms`);
      return interaction.editReply({
        content: `Removed <@&${role.id}> from <@${member.id}>`,
        ephemeral: true,
      });
    }
    member.roles.add(role);
    if (env.DEBUG_LOG) debugMsg(`Time taken: ${Date.now() - start}ms`);
    return interaction.editReply({
      content: `Added <@&${role.id}> to <@${member.id}>`,
      ephemeral: true,
    });
  } catch (error) {
    if (error.code == 50013) {
      return interaction.editReply({
        content: `I don't have permission to give you that role. Please contact the server staff. This is not an error with the bot.`,
        ephemeral: true,
      });
    } else {
      return interaction.editReply({
        content: `An error occurred. Please contact the bot developer.\nPlease provide a screenshot of this message\n\`${error.code}\``,
        ephemeral: true,
      });
    }
  }
};
