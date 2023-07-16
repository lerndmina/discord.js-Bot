const { SlashCommandBuilder, EmbedBuilder, userMention } = require("discord.js");
const BasicEmbed = require("../utils/BasicEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poke")
    .setDescription("Mention a user")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to mention").setRequired(true)
    ),
  options: {
    devOnly: true,
  },
  run: async ({ interaction, client, handler }) => {
    const user = interaction.options.getUser("user");

    embed = BasicEmbed(
      client,
      "Poke! 👉",
      `Hello ${userMention(user.id)}\n\n ${userMention(interaction.user.id)} poked you!`,
      "#0099ff"
    );

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
