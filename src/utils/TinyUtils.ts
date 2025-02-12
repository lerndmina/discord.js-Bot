import {
  Client,
  Snowflake,
  Guild,
  User,
  Channel,
  ClientApplication,
  BaseInteraction,
  Interaction,
  CommandInteraction,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  InteractionReplyOptions,
  Base,
  RepliableInteraction,
  MessageFlags,
  Message,
  GuildMember,
  ButtonBuilder,
  ButtonStyle,
  Role,
} from "discord.js";
import FetchEnvs from "./FetchEnvs";
import log from "fancy-log";
import BasicEmbed from "./BasicEmbed";
import { Url } from "url";
import chalk from "chalk";
import { ParsedTime } from "./ParseTimeFromMessage";
import ButtonWrapper from "./ButtonWrapper";
import { randomUUID } from "crypto";

const env = FetchEnvs();

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function isVoiceMessage(message: Message) {
  return message.flags.bitfield === MessageFlags.IsVoiceMessage && message.attachments.size == 1;
}

export async function postWebhookToThread(url: Url, threadId: Snowflake, content: string) {
  try {
    await fetch(`${url}?thread_id=${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content }),
    });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
}

export async function sendDM(userId: Snowflake, content: string, client: Client<true>) {
  try {
    const thingGetter = new ThingGetter(client);
    const user = await thingGetter.getUser(userId);
    return await user.send(content);
  } catch (error) {
    log.error(
      "Failed to send a DM to user: " +
        userId +
        "I probably don't have permission to send DMs to them. Error to follow:"
    );
    log.error(error);
  }
}

export class ThingGetter {
  typeMap: { users: string; channels: string; guilds: string };
  client: Client<true>;
  constructor(client: Client<true>) {
    this.client = client;
    this.typeMap = {
      users: "users",
      channels: "channels",
      guilds: "guilds",
    };
  }

  async getUser(id: Snowflake) {
    return this.#get(id, "users") as unknown as User; // This is technically safe
  }

  async getChannel(id: Snowflake) {
    return this.#get(id, "channels") as unknown as Channel; // This is technically safe
  }

  async getGuild(id: Snowflake) {
    return this.#get(id, "guilds") as unknown as Guild; // This is technically safe
  }

  async getMember(guild: Guild, id: Snowflake): Promise<GuildMember> {
    const member = guild.members.cache.get(id);
    return member ? member : await guild.members.fetch(id);
  }

  async getRole(guild: Guild, id: Snowflake): Promise<Role | null> {
    const role = guild.roles.cache.get(id);
    return role ? role : await guild.roles.fetch(id);
  }

  async getMessage(channel: Channel, id: Snowflake): Promise<Message | null> {
    const message = (channel as any).messages.cache.get(id);
    if (!message) {
      return await (channel as any).messages.fetch(id);
    }
    return null;
  }

  async getMessageFromUrl(url: URL): Promise<Message | null> {
    debugMsg(`Getting message from url: ${url.href}`);
    const discordLinkReg = /https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
    const match = discordLinkReg.exec(url.href);
    if (!match) {
      throw new Error("Invalid message url. Does not match discord message regex.");
    }
    // const guildId = match[1]; // Might be useful later
    const channelId = match[2];
    const messageId = match[3];

    const channel = await this.getChannel(channelId);
    return await this.getMessage(channel, messageId);
  }

  getMemberName(guildMember: GuildMember) {
    return guildMember.nickname || this.getUsername(guildMember.user);
  }

  getUsername(user: User) {
    return user.globalName || user.username;
  }

  async #get(id: Snowflake, type: "users" | "channels" | "guilds") {
    var start = env.DEBUG_LOG ? Date.now() : undefined;
    const property = this.typeMap[type];
    if (!property) {
      throw new Error(`Invalid type: ${type}`);
    }

    let thing = (this.client as any)[property].cache.get(id);
    if (!thing) {
      thing = await (this.client as any)[property].fetch(id);
    }
    if (env.DEBUG_LOG) debugMsg(`ThingGetter - Time taken: ${Date.now() - start!}ms`);
    return thing;
  }
}

export function debugMsg(msg: string | Object) {
  if (!env.DEBUG_LOG) return;
  if (msg instanceof Object) {
    log.info(msg);
  } else {
    log.info(`DEBUG: ${msg}`);
  }
}

export async function returnMessage(
  interaction: RepliableInteraction,
  client: Client<true>,
  title: string,
  message: string,
  args: { error?: boolean; firstMsg?: boolean; ephemeral?: boolean } = {
    error: false,
    firstMsg: false,
    ephemeral: true,
  }
) {
  const embed = BasicEmbed(
    client,
    args.error ? "Error" : title,
    message.toString(),
    undefined,
    args.error ? "Red" : "Green"
  );

  try {
    if (args.firstMsg) {
      return await interaction.reply({
        content: "",
        embeds: [embed],
        ephemeral: args.ephemeral,
      });
    }
    await interaction.editReply({
      content: "",
      embeds: [embed],
    });
  } catch (error) {
    await interaction.channel?.send({
      content: "",
      embeds: [embed],
    });
  }
}

export function getTagKey(guildId: Snowflake, tagName: string) {
  return `${guildId}:${tagName}`;
}

export function upperCaseFirstLetter(string: string) {
  if (!string) return;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * @description Replaces all occurrences of the literal string "\n" with the newline character in the given string.
 */
export function parseNewlines(string: string) {
  return string.replace(/\\n/g, "\n");
}

export function getTagName(tagKey: string) {
  return tagKey.split(":")[1];
}

export async function uploadImgurFromBase64(base64Image: string) {
  const clientId = env.IMGUR_CLIENT_ID;
  const url = "https://api.imgur.com/3/image";

  // Strip data URI scheme if present (assuming base64 encoded image starts with data:image)
  const strippedImage = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${clientId}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: strippedImage,
        type: "base64",
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export function stripMotdColor(text: string) {
  // Regular expression to match the color code pattern (§ followed by any character)
  const colorCodeRegex = /§./g;

  return text.replace(colorCodeRegex, "");
}

export function flattenStringArray(array: string[] | string) {
  if (typeof array === "string") {
    return array;
  }
  return array.join("\n");
}

export async function prepModmailMessage(
  client: Client<true>,
  message: Message,
  characterLimit: number
) {
  var content = message.content;
  var attachments = message.attachments.map((attachment) => {
    return attachment.url;
  });
  var allContent = [content, attachments.length > 0 ? "\nAttachments:" : "", ...attachments].join(
    "\n"
  );

  if (!allContent && message.stickers.size !== 0) {
    await message.react("❌");
    const botmessage = await message.reply({
      content: "",
      embeds: [
        BasicEmbed(
          client,
          "Modmail Error",
          "Tried to send an empty message.\n\nStickers are not supported in modmail at this time. Sending a message with a sticker will strip the sticker and send the message without it."
        ),
      ],
    });
    deleteMessage(botmessage, 15000);
  }

  if (allContent.length > characterLimit) {
    await message.react("❌");
    const botmessage = await message.reply({
      content: "",
      embeds: [
        BasicEmbed(
          client,
          "Modmail Error",
          `Your message is too long to send. Please keep your messages under ${characterLimit} characters.\n\nThis error can also occur if you somehow managed to send a message with no content.`
        ),
      ],
    });
    deleteMessage(botmessage, 15000);
    return null;
  }
  return allContent;
}

export async function deleteMessage(message: Message, timeout = 0) {
  try {
    if (!timeout) return message.delete();
    await sleep(timeout);
    return message.delete();
  } catch (error) {
    log.error(
      `Failed to delete message: ${message.id} in ${message.channel.id} it may have already been deleted.`
    );
    log.error(error);
  }
}

export async function modalTimedOutFollowUp(interaction: CommandInteraction, client: Client<true>) {
  interaction.followUp({
    content: "",
    embeds: [
      BasicEmbed(
        client,
        "Modal Timed Out",
        "Hey!\nYou took too long, slowpoke!\nThe modal you were interacting with has timed out and you forced me here. I don't like it here. It's cold and dark without your modal content to warm my heart. Try better next time yeah?"
      ),
    ],
    ephemeral: true,
  });
}

export async function pastebinUrlToJson(url: URL): Promise<JSON> {
  // Check if valid url
  if (url.hostname !== "pastebin.com" && url.hostname !== "shrt.zip") return {} as JSON;

  if (url.hostname === "shrt.zip") {
    url = replaceInUrl(url, "/u/", "/r/");
    url = replaceInUrl(url, "/code/", "/r/");

    const json = await (await fetch(url.href)).json();
    return json;
  }

  if (url.pathname.startsWith("/raw")) return await (await fetch(url.href)).json();

  return await (await fetch(`${url.origin}/raw${url.pathname}`)).json();
}

export function getValidUrl(urlString: string) {
  try {
    return new URL(urlString);
  } catch (error) {
    return null;
  }
}

export function replaceInUrl(url: URL, oldString: string, newString: string) {
  var urlString = url.toString();
  urlString = urlString.replace(oldString, newString);

  return new URL(urlString);
}

export function getTimeMessage(time: ParsedTime, id: Snowflake, ephemeral = false) {
  const buttons = ButtonWrapper([
    new ButtonBuilder()
      .setCustomId("deleteMe-" + id)
      .setLabel("Delete Me")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🗑️"),
    new ButtonBuilder()
      .setCustomId("ts_dmMe-" + id + "-" + time.seconds + "-" + randomUUID())
      .setLabel("I'm on Mobile!")
      .setEmoji("📱")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setURL("https://hammertime.cyou/en-GB?t=" + time.seconds)
      .setLabel("Edit this timestamp")
      .setStyle(ButtonStyle.Link),
  ]);

  const content = `Converted to timestamp: ⏰ <t:${time.seconds}:F>\nUsing the timezone: \`${
    time.tz
  }\`\n\nUse this in your own message: \`\`\`<t:${time.seconds}:F>\`\`\`${
    ephemeral ? "\n\nYou don't have permission to send public timestamps on other's messages." : ""
  }`;

  return { content, components: ephemeral ? [] : buttons, ephemeral };
}

export function msToTime(duration: number) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));

  let timeString = "";

  if (days > 0) {
    timeString += `${days}d `;
  }
  if (hours > 0) {
    timeString += `${hours}h `;
  }
  if (minutes > 0) {
    timeString += `${minutes}m `;
  }
  if (seconds > 0) {
    timeString += `${seconds}s`;
  }

  return timeString.trim();
}

export async function fetchWithRedirectCheck(url: URL) {
  const response = await fetch(url, { redirect: "follow" });
  if (response.type === "opaqueredirect") {
    throw new Error("Redirected to opaque URL, unable to determine final URL");
  }
  return response.url;
}

export function tsToDiscordTimestamp(ts: number) {
  return `<t:${Math.floor(ts / 1000)}:F>`;
}
