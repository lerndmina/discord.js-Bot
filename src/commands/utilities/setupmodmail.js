const { SlashCommandBuilder, EmbedBuilder, userMention, ForumChannel } = require("discord.js");
const BasicEmbed = require("../../utils/BasicEmbed");
const log = require("fancy-log");
const ModmailConfig = require("../../models/ModmailConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setupmodmail")
    .setDescription("Setup modail for this discord server.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The forum channel to put the modmail channels in.")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to ping when a new modmail is created.")
        .setRequired(true)
    ),
  options: {
    devOnly: true,
    deleted: false,
    guildOnly: true,
    userPermissions: ["Administrator"],
    botPermissions: ["Administrator"],
  },
  run: async ({ interaction, client, handler }) => {
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("role");
    if (!(channel instanceof ForumChannel)) {
      return interaction.reply({
        embeds: [BasicEmbed(client, "‼️ Error", "The channel must be a forum channel.", "Red")],
        ephemeral: true,
      });
    }

    await interaction.reply("<a:waiting:1182406401641955328>");

    try {
      const modmailConfig = await ModmailConfig.findOneAndUpdate(
        { guildId: interaction.guild.id },
        {
          guildId: interaction.guild.id,
          forumChannelId: channel.id,
          staffRoleId: role.id,
        },
        {
          upsert: true,
          new: true,
        }
      );
    } catch (error) {
      return interaction.editReply({
        content: "<:yikes:950428967301709885>",
      });
    }

    interaction.editReply("🎉 Successfully created modmail config entry!");
  },
};
