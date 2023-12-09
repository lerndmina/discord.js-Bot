const {
  SlashCommandBuilder,
  EmbedBuilder,
  userMention,
  ChannelType,
  ClientUser,
} = require("discord.js");
const BasicEmbed = require("../../utils/BasicEmbed");
const Modmail = require("../../models/Modmail");
const { waitingEmoji } = require("../../Bot");
const { ThingGetter } = require("../../utils/TinyUtils");
const { Database } = require("../../utils/cache/database");
const log = require("fancy-log");

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
    const getter = new ThingGetter(client);
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

    const forumThread = await getter.getChannel(mail.forumThreadId);
    try {
      const webhook = await client.fetchWebhook(mail.webhookId, mail.webhookToken);
      webhook.delete();
    } catch (error) {
      log.error("Webhook missing, probably already deleted.");
    }
    const embed = BasicEmbed(
      client,
      "Modmail Closed",
      `This modmail thread has been closed.\n\nReason: ${reason}\n\nYou can open a modmail by sending another message to the bot.`,
      "Red"
    );

    await forumThread.send({
      embeds: [embed],
    });

    (await getter.getUser(mail.userId)).send({
      embeds: [embed],
    });
    forumThread.setArchived(true, reason);

    const db = new Database();
    await db.deleteOne(Modmail, { forumThreadId: forumThread.id });

    await interaction.editReply("🎉 Successfully closed modmail thread!");
  },
};
