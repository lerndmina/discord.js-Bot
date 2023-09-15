const { SlashCommandBuilder, ChannelType } = require("discord.js");
const BasicEmbed = require("../utils/BasicEmbed");
var log = require("fancy-log");
const { Channel } = require("diagnostics_channel");

const GuildNewVC = require("../models/GuildNewVC");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("temp-vc")
    .setDescription("Create or delete a temporary voice channel for this guild.")
    .addSubcommand((subcommand) => {
      return subcommand
        .setName("create")
        .setDescription("Create a temporary voice channel for this guild.")
        .addChannelOption((option) =>
          option.setName("channel").setDescription("The channel you want to use").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("What category to put the temp VCs in.")
            .setRequired(true)
            .setMinLength(17)
        );
    })
    .addSubcommand((subcommand) => {
      return subcommand
        .setName("delete")
        .setDescription("Delete the temporary voice channel for this guild.")
        .addChannelOption((option) =>
          option.setName("channel").setDescription("The users join.").setRequired(true)
        );
    }),
  options: {
    devOnly: false,
    deleted: false,
    userPermissions: ["Administrator"],
  },

  run: async ({ interaction, client, handler }) => {
    const subcommand = interaction.options.getSubcommand();

    const query = {
      guildID: interaction.guild.id,
    };

    if (subcommand === "create") {
      var channel = interaction.options.getChannel("channel");

      const category = interaction.options.getString("category");

      // Check if the category exists
      const categoryChannel = interaction.guild.channels.cache.get(category);
      if (!categoryChannel) {
        await interaction.reply({
          content: `The category ${category} does not exist.`,
          ephemeral: true,
        });
        return;
      }

      if (categoryChannel.type !== ChannelType.GuildCategory) {
        await interaction.reply({
          content: `The category \`${categoryChannel.name}\` is not a category.`,
          ephemeral: true,
        });
        return;
      }

      // Check if the channel is a voice channel
      if (channel.type !== ChannelType.GuildVoice) {
        await interaction.reply({
          content: `The channel \`${channel.name}\` is not a voice channel.`,
          ephemeral: true,
        });

        return;
      }

      await interaction.reply({
        embeds: [
          BasicEmbed(client, "Creating...", `Creating temp vc under \`${categoryChannel.name}.`),
        ],
      });

      try {
        const vcList = await GuildNewVC.findOne(query);

        if (vcList) {
          vcList.guildChannelIDs.push({
            channelID: channel.id,
            categoryID: category,
          });
          await vcList.save();
        } else {
          const newVCList = new GuildNewVC({
            guildID: interaction.guild.id,
            guildChannelIDs: [
              {
                channelID: channel.id,
                categoryID: category,
              },
            ],
          });
          await newVCList.save();
        }

        await interaction.editReply({
          embeds: [
            BasicEmbed(
              client,
              "Success!",
              `Assigned \`${channel.name}.\` to a temp vc under \`${categoryChannel.name}\`.`,
              "#0099ff"
            ),
          ],
          ephemeral: true,
        });
      } catch (error) {
        log(`Error creating temp vc creator: \`\`\`${error}\`\`\``);

        await interaction.editReply({
          embeds: [
            BasicEmbed(
              client,
              "Error!",
              `Error creating temp vc creator: \`\`\`${error}\`\`\``,
              "#0099ff"
            ),
          ],
          ephemeral: true,
        });
      }
    } else if (subcommand === "delete") {
      // Check if channel is in the DB then delete the entry for it
      var channel = interaction.options.getChannel("channel");

      const vcList = await GuildNewVC.findOne(query);

      if (!vcList) {
        await interaction.reply({
          content: `There are no temp VCs for this guild.`,
          ephemeral: true,
        });
        return;
      }

      const vc = vcList.guildChannelIDs.find((vc) => vc.channelID === channel.id);

      if (!vc) {
        await interaction.reply({
          content: `The channel \`${channel.name}\` is not a temp VC.`,
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        embeds: [
          BasicEmbed(client, "Deleting...", `Deleting temp vc creator \`${channel.name}.\``),
        ],
      });

      try {
        vcList.guildChannelIDs = vcList.guildChannelIDs.filter((vc) => vc.channelID !== channel.id);
        await vcList.save();

        await interaction.editReply({
          embeds: [
            BasicEmbed(
              client,
              "Success!",
              `Deleted temp vc creator \`${channel.name}\`.`,
              "#0099ff"
            ),
          ],
          ephemeral: true,
        });
      } catch (error) {
        log(`Error deleting temp vc creator:`);
        log(error);

        await interaction.editReply({
          embeds: [
            BasicEmbed(
              client,
              "Error!",
              `Error deleting temp vc creator: \`\`\`${error}\`\`\``,
              "#0099ff"
            ),
          ],
          ephemeral: true,
        });
      }
    }
  },
};
