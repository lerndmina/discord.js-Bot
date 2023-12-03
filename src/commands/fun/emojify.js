const { SlashCommandBuilder, EmbedBuilder, userMention } = require("discord.js");
const BasicEmbed = require("../../utils/BasicEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emojify")
    .setDescription("Convert text to emojis")
    .addStringOption((option) =>
      option.setName("text").setDescription("The text to convert").setRequired(true)
    ),
  options: {
    devOnly: true,
    deleted: false,
    guildOnly: false,
  },
  run: async ({ interaction, client, handler }) => {
    const text = interaction.options.getString("text");

    const emojified = text
      .split("")
      .map((letter) => {
        if (letter === " ") return ":heavy_minus_sign:";
        else if (/[a-zA-Z]/.test(letter)) return `:regional_indicator_${letter}:`;
        else return letter;
      })
      .join("");

    if (emojified.length > 2000) {
      await interaction.reply({
        embeds: [
          BasicEmbed(
            client,
            "‼️ Error",
            `The emojified text is too long.\n\n\`${emojified.length}\` characters is larger than the limit of \`2000\``,
            "Red"
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const embed = BasicEmbed(client, "Emojified!", `${emojified}`, "Random");

    interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
  },
};
