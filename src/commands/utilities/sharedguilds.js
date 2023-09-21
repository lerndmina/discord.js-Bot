const {
  SlashCommandBuilder,
  Client,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const log = require("fancy-log");
const BasicEmbed = require("../../utils/BasicEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shared")
    .setDescription("List the guilds you share with the bot."),
  options: {
    devOnly: true,
    deleted: false,
  },
  run: async ({ interaction, client, handler }) => {
    //code to fetch mutual servers
    const guilds = [];
    for (const [, guild] of client.guilds.cache) {
      await guild.members
        .fetch(interaction.user)
        .then(() => guilds.push(guild))
        .catch((error) => console.log(error));
    }

    //code to generate array of server names & IDs for .addOption() in select menu component
    const servers = [];
    for (let i = 0; i < Object.keys(guilds).length; i++) {
      servers.push({
        label: Object.entries(guilds)[i][1].name,
        value: Object.entries(guilds)[i][1].id,
      });
    }

    const serverMenu = new StringSelectMenuBuilder()
      .setCustomId("serverMenu")
      .setPlaceholder("Select a server")
      .setMinValues(1)
      .setMaxValues(1);

    serverMenu.addOptions(servers);

    const row1 = new ActionRowBuilder().addComponents(serverMenu);

    const response = await interaction.reply({
      embeds: [
        BasicEmbed(
          interaction.client,
          "Shared Guilds",
          `Select a server to view the guild's information.`
        ),
      ],
      components: [row1],
      ephemeral: true,
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;

    try {
      const interactionResponse = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60000,
      });

      /**
       * @type {import("discord.js").Guild}
       */
      const guild = client.guilds.cache.get(interactionResponse.values[0]);

      log(guild.name);

      /**
       * @type {import("discord.js").MessageEmbed}
       */
      const guildEmbed = BasicEmbed(interaction.client, `Viewing Guild: ${guild.name}`, `*`, [
        { name: "ID", value: `\`${guild.id}\``, inline: false },
        { name: "Members", value: `\`${guild.memberCount}\``, inline: false },
        {
          name: "Created",
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          inline: false,
        },
      ]);

      await interaction.editReply({
        embeds: [guildEmbed],
        components: [],
        ephemeral: true,
      });
    } catch (e) {
      log.error(e);
      await interaction.editReply({
        content: "No response was given in time or an error occured.",
        components: [],
        ephemeral: true,
      });
    }
  },
};
