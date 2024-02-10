import {
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
  MessageComponentInteraction,
  InteractionResponse,
  CollectorFilter,
  BaseInteraction,
  Guild,
  ForumChannel,
  Snowflake,
} from "discord.js";
import { ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";
import log from "fancy-log";
import BasicEmbed from "../../utils/BasicEmbed";
import Modmail from "../../models/Modmail";
import ModmailConfig from "../../models/ModmailConfig";
import ButtonWrapper from "../../utils/ButtonWrapper";
import { removeMentions, waitingEmoji } from "../../Bot";
import { debugMsg, isVoiceMessage, postWebhookToThread, ThingGetter } from "../../utils/TinyUtils";
import Database from "../../utils/cache/database";
import { Url } from "url";
import FetchEnvs from "../../utils/FetchEnvs";
import { debug } from "console";
const env = FetchEnvs();

const MAX_TITLE_LENGTH = 50;

export default async function (message: Message, client: Client<true>) {
  const db = new Database();
  if (message.author.bot) return;
  const user = message.author;

  try {
    if (isVoiceMessage(message))
      return message.reply("I don't support voice messages in modmail threads.");
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
          "Modmail ERROR",
          `An unhandled error occured while trying to process your message. Please contact the bot developer. I've logged the error for them.\n\nI just prevented the entire bot from crashing. This should never have happened lmao.\nHere's the error: \`\`\`${error}\`\`\``,
          undefined,
          "Red"
        ),
      ],
    });
    log.error(error);
  }
}

async function handleDM(message: Message, client: Client<true>, user: User) {
  if (message.content.length > 2000 || message.content.length <= 0)
    return message.reply({
      embeds: [
        BasicEmbed(
          client,
          "Modmail Error",
          "Your message is too long to send. Please keep your messages under 2000 characters.\n\nThis error can also occur if you send an empty message. Please send a message with content.",
          undefined,
          "Red"
        ),
      ],
    });

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

async function newModmail(customIds: string[], message: Message, user: User, client: Client<true>) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId(customIds[0])
      .setLabel("Create Modmail")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(customIds[1]).setLabel("Cancel").setStyle(ButtonStyle.Danger),
  ];

  const reply = await message.reply({
    content: "",
    embeds: [
      BasicEmbed(
        client,
        "Modmail",
        "Would you like to create a modmail thread?",
        undefined,
        "Random"
      ),
    ],
    components: ButtonWrapper(buttons),
  });

  const buttonFilter: CollectorFilter<[MessageComponentInteraction]> = (
    interaction: BaseInteraction
  ) => {
    if (interaction instanceof ButtonInteraction) {
      return customIds.includes(interaction.customId);
    }
    return false;
  };
  const collector = reply.createMessageComponentCollector({ filter: buttonFilter, time: 60000 });

  /**
   * @param {ButtonInteraction} i
   */
  collector.on("collect", async (i) => {
    const orignalMsg = await i.update({ content: waitingEmoji, components: [], embeds: [] });

    if (i.customId === customIds[1]) {
      // Cancel button clicked
      await orignalMsg.delete();
      return;
    }

    // Create button clicked
    // TODO: Look up which servers the user and bot are in that both have modmail enabled
    const sharedGuilds: Guild[] = [];
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
            undefined,
            "Random"
          ),
        ],
      });
      return;
    }
    const row = new ActionRowBuilder().addComponents(guildList);
    await orignalMsg.edit({
      embeds: [
        BasicEmbed(
          client,
          "Modmail",
          "Select a server to open a modmail thread in.",
          undefined,
          "Random"
        ),
      ],
      content: "",
      components: [row as any],
    });

    await serverSelectedOpenModmailThread(orignalMsg, stringSelectMenuID, message);
    return;
  });

  async function serverSelectedOpenModmailThread(
    reply: InteractionResponse,
    stringSelectMenuID: string,
    message: Message
  ) {
    const selectMenuFilter = (i: MessageComponentInteraction) => i.customId === stringSelectMenuID;
    const collector = reply.createMessageComponentCollector({
      filter: selectMenuFilter,
      time: 60000,
    });

    collector.on("collect", async (collectedInteraction) => {
      const i = collectedInteraction as StringSelectMenuInteraction;
      const value = JSON.parse(i.values[0]);
      const guildId = value.guild as Snowflake;
      const channelId = value.channel as Snowflake;
      const staffRoleId = value.staffRoleId as Snowflake;
      await reply.edit({ content: waitingEmoji, components: [], embeds: [] });

      const getter = new ThingGetter(client);
      const guild = await getter.getGuild(guildId);
      const member = await getter.getMember(guild, i.user.id);
      const memberName = member.nickname || member.user.displayName;

      const channel = (await getter.getChannel(channelId)) as unknown as ForumChannel; // TODO: This is unsafe
      const threads = channel.threads;
      const noMentionsMessage = removeMentions(message.content);
      const thread = await threads.create({
        name: `${
          noMentionsMessage.length >= MAX_TITLE_LENGTH
            ? `${noMentionsMessage.slice(0, MAX_TITLE_LENGTH)}...`
            : noMentionsMessage
        } - ${memberName}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        message: {
          content: `Modmail thread for ${memberName} | ${
            i.user.id
          }\n\n Original message: ${noMentionsMessage}${
            member.pending ? "\n\nUser has not fully joined the guild." : ""
          }`,
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
            `Hey! ${memberName} has opened a modmail thread!`,
            undefined,
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
            `Successfully created a modmail thread in **${guild.name}**!\n\nWe will get back to you as soon as possible. While you wait, why not grab a hot beverage!\n\nOnce we have solved your issue, you can use \`/close\` to close the thread. If you need to send us more information, just send it here! \n\nCommon answers to questions may be found on our [Wiki](${env.BOT_URL}/wiki) or our [Forums](${env.BOT_URL}/forum)`,
            undefined,
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
async function sendMessage(mail: any, message: Message, client: Client<true>) {
  const cleanMessageContent = removeMentions(message.content);
  const getter = new ThingGetter(client);
  try {
    const guild = await getter.getGuild(mail.guildId);
    const thread = (await getter.getChannel(mail.forumThreadId)) as ThreadChannel;
    const webhook = await client.fetchWebhook(mail.webhookId, mail.webhookToken);
    if (
      !(await postWebhookToThread(webhook.url as unknown as Url, thread.id, cleanMessageContent))
    ) {
      thread.send(
        `${message.author.username} says: ${cleanMessageContent}\n\n\`\`\`This message failed to send as a webhook, please contact the bot developer.\`\`\``
      );
      log.error("Failed to send message to thread, sending normally.");
    }
  } catch (error) {
    log.error(error);
    return message.react("<:error:1182430951897321472>");
  }
  return message.react("📨");
}

async function handleReply(message: Message, client: Client<true>, staffUser: User) {
  const db = new Database();
  const thread = message.channel;
  const messages = await thread.messages.fetch();

  // const lastMessage = messages.last()!; // Check that the bot is the one who opened the thread.
  // if (lastMessage.author.id !== client.user.id) return;

  const mail = await db.findOne(Modmail, { forumThreadId: thread.id });
  if (!mail) {
    return;
  }
  const getter = new ThingGetter(client);
  const guild = await getter.getGuild(mail.guildId);
  if (message.content.startsWith(".")) {
    // TODO move this to an env var
    return message.react("🕵️"); // Messages starting with . are staff only
  }
  if (message.cleanContent.length > 1024 || message.content.length <= 0) {
    debugMsg(message.content.length <= 0 ? "Message is empty" : "Message is too long");
    await message.react("❌");
    const botReply = await message.reply({
      embeds: [
        BasicEmbed(
          client,
          "Modmail Error",
          `Your message is either too long or short to send. Please keep your messages above 1 under 1024 characters.`,
          undefined,
          "Red"
        ),
      ],
    });
    // Wait 5 seconds and then delete the message
    setTimeout(() => {
      botReply.delete();
    }, 5000);
    return;
  }

  debugMsg(
    "Sending message to user" +
      mail.userId +
      " in guild " +
      mail.guildId +
      " from " +
      staffUser.globalName
  );

  (await getter.getUser(mail.userId)).send({
    embeds: [
      BasicEmbed(client, "Modmail Reply", `*`, [
        {
          name: `${getter.getMemberName(await getter.getMember(guild, staffUser.id))} (Staff):`,
          value: `${message.content}`,
          inline: false,
        },
      ]),
    ],
  });

  debugMsg("Sent message to user" + mail.userId + " in guild " + mail.guildId);

  return message.react("📨");
}
