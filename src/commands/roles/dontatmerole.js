const { SlashCommandBuilder, Client, BaseInteraction, Role } = require("discord.js");
const log = require("fancy-log");
const { Database } = require("../../utils/cache/database");
const DontAtMeRole = require("../../models/DontAtMeRole");
const { waitingEmoji } = require("../../Bot");
const BasicEmbed = require("../../utils/BasicEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dontatmerole")
    .setDescription("Set the Don't @ Me role for this server.")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to set as the Don't @ Me role")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option.setName("remove").setDescription("Remove the Don't @ Me role").setRequired(false)
    ),
  options: {
    devOnly: false,
    deleted: false,
    guildOnly: true,
    userPermissions: ["Administrator"],
  },
  run: async ({ interaction, client, handler }) => {
    const role = interaction.options.getRole("role");
    const remove = interaction.options.getBoolean("remove");
    if (!role && !remove) {
      interaction.reply({
        content: "You must specify a role to set as the Don't @ Me role.",
        ephemeral: true,
      });
      return;
    }
    if (role && remove) {
      interaction.reply({
        content: "You can't specify both a role and remove.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({ content: waitingEmoji, ephemeral: true });

    if (remove) removeRole(client, interaction);
    else setDontAtMeRole(client, interaction, role);
  },
};

/**
 * @param {Client} client
 * @param {BaseInteraction} interaction
 * @param {Role} role
 */
async function setDontAtMeRole(client, interaction, role) {
  const db = new Database();
  const roleId = role.id;
  const guildId = interaction.guild.id;

  await db.findOneAndUpdate(
    DontAtMeRole,
    { guildId: guildId },
    { guildId: guildId, roleId: roleId }
  );
  done(client, interaction, role);
}

/**
 * @param {Client} client
 * @param {BaseInteraction} interaction
 */
async function removeRole(client, interaction) {
  const db = new Database();
  const guildId = interaction.guild.id;

  await db.deleteOne(DontAtMeRole, { guildId: guildId });
  done(client, interaction);
}

/**
 * @param {Client} client
 * @param {BaseInteraction} interaction
 * @param {Role} role
 */
async function done(client, interaction, role = null) {
  await interaction.editReply({
    content: "",
    embeds: [
      BasicEmbed(
        client,
        "Don't @ Me Role",
        `Done! ${
          role ? `Set ${role.name} as the Don't @ Me role.` : "Removed the Don't @ Me role."
        }`
      ),
    ],
  });
}
