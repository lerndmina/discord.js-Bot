const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const BasicEmbed = require("../utils/BasicEmbed");
const permission = PermissionFlagsBits;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("massdelete")
    .setDescription("Deletes X number of messages from the channel.")
    .addIntegerOption((option) => option.setName("number").setDescription("Number of messages to delete").setRequired(true)),
  options: {
    devOnly: true,
    userPermissions: [ permission.ManageMessages ],
    botPermissions: [ permission.ManageMessages ],
  },
  run: async ({ interaction, client, handler }) => {
    // Check user permissions
    if (interaction.memberPermissions.has("MANAGE_MESSAGES") == false) {
      await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
      return;
    }

    var number = interaction.options.getInteger("number");
    if (number > 100) {
      await interaction.reply({ content: "You cannot delete more than 100 messages at a time.", ephemeral: true });
      return;
    }
    if (number < 1) {
      await interaction.reply({ content: "You cannot delete less than 1 message at a time.", ephemeral: true });
      return;
    }

    // Grab the messages from the channel
    const messages = await interaction.channel.messages.fetch({ limit: number });
    // write them to a text file and upload it to the success message
    var messageString = "";
    messages.forEach((message) => {
      messageString += `${message.author.username}#${message.author.discriminator} (${message.author.id}) - ${message.content}\n`;
    });

    await interaction.channel.bulkDelete(number);
    await interaction.reply({
      embeds: [BasicEmbed(interaction.client, `Purged Mesages`, `Deleted ${number} messages in ${interaction.channel.name}`)],
      files: [{ attachment: Buffer.from(messageString), name: "purged_messages.txt" }],
      ephemeral: true,
    });
  },
};
