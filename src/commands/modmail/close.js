const { SlashCommandBuilder, EmbedBuilder, userMention, ChannelType } = require("discord.js");
const BasicEmbed = require("../../utils/BasicEmbed");
const Modmail = require("../../models/Modmail");
const { waitingEmoji } = require("../../Bot");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close a modmail thread")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for closing the modmail thread")
        .setRequired(false)
    ),
  options: {
    devOnly: false,
    deleted: false,
    guildOnly: false,
    botPermissions: ["Administrator"],
  },
  run: async ({ interaction, client, handler }) => {
    const reason = interaction.options.getString("reason") || "No reason provided";

    var mail = await Modmail.findOne({ forumThreadId: interaction.channel.id });
    if (!mail && interaction.channel.type === ChannelType.DM)
      mail = await Modmail.findOne({ userId: interaction.user.id });
    if (!mail) {
      return interaction.reply({
        embeds: [BasicEmbed(client, "‼️ Error", "This channel is not a modmail thread.", "Red")],
        ephemeral: true,
      });
    }

    await interaction.reply(waitingEmoji);

    const forumThread = await client.channels.fetch(mail.forumThreadId);
    const webhook = await client.fetchWebhook(mail.webhookId, mail.webhookToken);
    webhook.delete();
    await forumThread.send({
      embeds: [
        BasicEmbed(
          client,
          "Modmail Closed",
          `This modmail thread has been closed.\n\nReason: ${reason}`,
          "Red"
        ),
      ],
    });
    forumThread.setArchived(true, reason);

    await Modmail.deleteOne({ forumThreadId: forumThread.id });

    interaction.editReply("🎉 Successfully closed modmail thread!");
  },
};
