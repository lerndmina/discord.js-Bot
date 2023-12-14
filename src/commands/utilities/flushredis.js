const { SlashCommandBuilder, Client, BaseInteraction } = require("discord.js");
const log = require("fancy-log");
const { redisClient } = require("../../Bot");

module.exports = {
  data: new SlashCommandBuilder().setName("flushredis").setDescription("Flushes redis!"),
  options: {
    devOnly: true, //! MUST REMAIN DEV ONLY!!!
    deleted: false,
  },
  run: ({ interaction, client, handler }) => {
    redisClient.flushAll();
    interaction.reply({ content: "Flushed redis!", ephemeral: true });
  },
};
