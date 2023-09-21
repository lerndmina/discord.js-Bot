const { SlashCommandBuilder, Client, BaseInteraction } = require("discord.js");
const log = require("fancy-log");

module.exports = {
  data: new SlashCommandBuilder().setName("hello").setDescription("Says hello!"),
  options: {
    devOnly: true,
    deleted: false,
  },
  run: ({ interaction, client, handler }) => {
    interaction.reply({ content: "Hello World!", ephemeral: true });
  },
};
