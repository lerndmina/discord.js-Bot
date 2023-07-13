const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!").addBooleanOption((option) => option.setName("private").setDescription("Whether to reply privately or not")),
  options: {
    devOnly: false,
  },
  run: async ({ interaction, client, handler }) => {
    const private = interaction.options.getBoolean("private");

    const timestamp = interaction.createdTimestamp;
    const currentTime = Date.now();
    const latency = currentTime - timestamp;

    var wsPing = interaction.client.ws.ping;
    var deffered = false;

    if (wsPing == -1) {
      var preEmbed = new EmbedBuilder()
        .setTitle("🏓 Pong!")
        .addFields({ name: `Websocket`, value: `Bot just started, pinging again...` })
        .addFields({ name: `Message Latency`, value: `${latency}ms` })
        .setColor("#0099ff");
      await interaction.reply({ embeds: [preEmbed], ephemeral: private });

      await new Promise((r) => setTimeout(r, 30000));
      wsPing = interaction.client.ws.ping;
      deffered = true;
    }

    const postEmbed = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .addFields({ name: `Websocket`, value: `${wsPing}ms` })
      .addFields({ name: `Message Latency`, value: `${latency}ms` })
      .setColor("#0099ff");

    if (deffered) {
      await interaction.editReply({ embeds: [postEmbed], ephemeral: private });
    } else {
      await interaction.reply({ embeds: [postEmbed], ephemeral: private });
    }
  },
};
