const {
  MessageType,
  MessageFlags,
  ActivityType,
  Message,
  Client,
  User,
  ButtonInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuInteraction,
  ThreadAutoArchiveDuration,
  ThreadChannel,
} = require("discord.js");
const { ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js");
var log = require("fancy-log");
const BasicEmbed = require("../../utils/BasicEmbed");
const Modmail = require("../../models/Modmail");
const ModmailConfig = require("../../models/ModmailConfig");
const ButtonWrapper = require("../../utils/ButtonWrapper");
const { waitingEmoji } = require("../../Bot");
const { postWebhookToThread, ThingGetter } = require("../../utils/TinyUtils");
const { Database } = require("../../utils/cache/database");
const MAX_TITLE_LENGTH = 50;

module.exports = async (message, client) => {
  const db = new Database();
  if (message.author.bot) return;
  const user = message.author;

  try {
    if (message.guildId) {
      if (message.channel instanceof ThreadChannel) {
        await handleReply(message, client, user);
      }
    } else {
      await handleDM(message, client, user);
    }
  } catch (error) {
    message.reply({
      embeds: [
        BasicEmbed(
          client,
          "Modmail",
          "An unhandled error occured while trying to process your message. Please contact the bot developer. I've logged the error for them.",
          "Red"
        ),
      ],
    });
    log.error(error);
  }
};

/**
 * @param {Message} message
 * @param {Client} client
 * @param {User} user
 */
async function handleDM(message, client, user) {
  const db = new Database();
  const requestId = message.id;
  // const mail = await Modmail.findOne({ userId: user.id });
  const mail = await db.findOne(Modmail, { userId: user.id });
  const customIds = [`create-${requestId}`, `cancel-${requestId}`];
  if (!mail) {
    await newModmail(customIds, message, user, client);
  } else {
    await sendMessage(mail, message, client);
  }
}

/**
 * @param {String[]} customIds
 * @param {Message} message
 * @param {User} user
 * @param {Client} client
 */
async function newModmail(customIds, message, user, client) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId(customIds[0])
      .setLabel("Create Modmail")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(customIds[1]).setLabel("Cancel").setStyle(ButtonStyle.Danger),
  ];

  const reply = await message.reply({
    content: "",
    embeds: [BasicEmbed(client, "Modmail", "Would you like to create a modmail thread?", "Random")],
    components: ButtonWrapper(buttons),
  });

  /**
   * @param {ButtonInteraction} i
   */
  const buttonFilter = (i) => customIds.includes(i.customId);
  const collector = reply.createMessageComponentCollector({ filter: buttonFilter, time: 60000 });

  /**
   * @param {ButtonInteraction} i
   */
  collector.on("collect", async (i) => {
    const orignalMsg = await i.update({ content: waitingEmoji, components: [], embeds: [] });

    if (i.customId === customIds[1]) {
      // Cancel button
      await orignalMsg.delete();
      return;
    }

    // Create button
    // TODO: Look up which servers the user and bot are in that both have modmail enabled
    const sharedGuilds = [];
    const cachedGuilds = client.guilds.cache;
    for (const [, guild] of cachedGuilds) {
      await guild.members
        .fetch(i.user)
        .then(() => sharedGuilds.push(guild))
        .catch((error) => console.log(error));
    }
    const stringSelectMenuID = `guildList-${i.id}`;
    var guildList = new StringSelectMenuBuilder()
      .setCustomId(stringSelectMenuID)
      .setPlaceholder("Select a server")
      .setMinValues(1)
      .setMaxValues(1);
    var addedSomething = false;
    for (var guild of sharedGuilds) {
      const db = new Database();
      const config = await db.findOne(ModmailConfig, { guildId: guild.id });
      if (config) {
        addedSomething = true;
        guildList.addOptions({
          label: guild.name,
          value: JSON.stringify({
            guild: config.guildId,
            channel: config.forumChannelId,
            staffRoleId: config.staffRoleId,
          }),
        });
      }
    }

    if (!addedSomething) {
      await orignalMsg.edit({
        content: "",
        components: [],
        embeds: [
          BasicEmbed(
            client,
            "Modmail",
            "There are no servers that have modmail enabled that you and I are both in.",
            "Random"
          ),
        ],
      });
      return;
    }
    const row = new ActionRowBuilder().addComponents(guildList);
    await orignalMsg.edit({
      embeds: [
        BasicEmbed(client, "Modmail", "Select a server to open a modmail thread in.", "Random"),
      ],
      content: "",
      components: [row],
    });

    await serverSelectedOpenModmailThread(orignalMsg, stringSelectMenuID, message);
    return;
  });

  /**
   *
   * @param {ButtonInteraction} reply
   */
  async function serverSelectedOpenModmailThread(reply, stringSelectMenuID, message) {
    const selectMenuFilter = (i) => i.customId === stringSelectMenuID;
    const collector = reply.createMessageComponentCollector({
      filter: selectMenuFilter,
      time: 60000,
    });

    /**
     * @param {StringSelectMenuInteraction} stringSelectInteraction
     */
    collector.on("collect", async (i) => {
      const value = JSON.parse(i.values[0]);
      const guildId = value.guild;
      const channelId = value.channel;
      const staffRoleId = value.staffRoleId;
      await reply.edit({ content: waitingEmoji, components: [], embeds: [] });

      const guild = client.guilds.cache.get(guildId);
      const member = guild.members.cache.get(i.user.id);
      const memberName = member.nickname || member.user.displayName;

      const channel = client.channels.cache.get(channelId);
      const threads = channel.threads;
      const thread = await threads.create({
        name: `${
          message.content.length >= MAX_TITLE_LENGTH
            ? `${message.content.slice(0, MAX_TITLE_LENGTH)}...`
            : message.content
        } - ${memberName}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        message: {
          content: `Modmail thread for ${memberName} | ${i.user.id}\n\n Original message: ${
            message.content
          }${member.pending ? "\n\nUser has not fully joined the guild." : ""}`,
        },
      });

      const webhook = await channel.createWebhook({
        name: memberName,
        avatar: i.user.displayAvatarURL(),
        reason: "Modmail Webhook, required to show the user properly.",
      });

      thread.send({
        content: `<@&${staffRoleId}>`,
        embeds: [
          BasicEmbed(
            client,
            "Modmail",
            "`Hey! ${memberName} has opened a modmail thread!`",
            "Random"
          ),
        ],
      });

      const db = new Database();
      await db.findOneAndUpdate(
        Modmail,
        { userId: i.user.id },
        {
          guildId: guildId,
          forumThreadId: thread.id,
          userId: i.user.id,
          webhookId: webhook.id,
          webhookToken: webhook.token,
        },
        {
          upsert: true,
          new: true,
        }
      );

      reply.edit({
        content: ``,
        embeds: [
          BasicEmbed(
            client,
            "Modmail",
            `Successfully created modmail thread in ${guild.name}!\nStaff will reply below. You can send messages here to reply to staff.`,
            "Random"
          ),
        ],
        components: [],
      });
    });
  }
}

/**
 * @param {Modmail} mail
 * @param {Message} message
 * @param {Client} client
 */
async function sendMessage(mail, message, client) {
  const getter = new ThingGetter(client);
  try {
    const guild = await getter.getGuild(mail.guildId);
    const thread = await getter.getChannel(mail.forumThreadId);
    const webhook = await client.fetchWebhook(mail.webhookId, mail.webhookToken);
    if (!(await postWebhookToThread(webhook.url, thread.id, message.content))) {
      thread.send(
        `${message.author.username} says: ${message.content}\n\n\`\`\`This message failed to send as a webhook, please contact the bot developer.\`\`\``
      );
      log.error("Failed to send message to thread, sending normally.");
    }
  } catch (error) {
    log.error(error);
    return message.react("<:error:1182430951897321472>");
  }
  return message.react("📨");
}

async function handleReply(message, client, staffUser) {
  const db = new Database();
  const thread = message.channel;
  const messages = await thread.messages.fetch();
  const lastMessage = messages.last();

  const mail = await db.findOne(Modmail, { forumThreadId: thread.id });
  if (!mail) {
    return;
  }
  const getter = new ThingGetter(client);
  if (lastMessage.author.id === client.user.id)
    (await getter.getUser(mail.userId)).send({ content: message.content });
}
