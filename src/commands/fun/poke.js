const { SlashCommandBuilder, EmbedBuilder, userMention } = require("discord.js");
const BasicEmbed = require("../../utils/BasicEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poke")
    .setDescription("Mention a user")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to mention").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("message").setDescription("The message to send").setRequired(false)
    ),
  options: {
    devOnly: false,
    deleted: false,
    guildOnly: true,
  },
  run: async ({ interaction, client, handler }) => {
    const user = interaction.options.getUser("user");
    const text = interaction.options.getString("message");

    embed = BasicEmbed(
      client,
      "Poke! 👉",
      `${userMention(interaction.user.id)} poked you! ${text ? `\n\n\`${text}\`` : ""}`,
      "#0099ff"
    );

    await interaction.reply({
      content: `Hello ${userMention(user.id)}`,
      embeds: [embed],
      ephemeral: false,
    });
  },
};
