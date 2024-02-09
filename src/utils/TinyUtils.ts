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
} from "discord.js";
import FetchEnvs from "./FetchEnvs";
import log from "fancy-log";
import BasicEmbed from "./BasicEmbed";
import { Url } from "url";
import chalk from "chalk";

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

  async getMember(guild: Guild, id: Snowflake) {
    const member = guild.members.cache.get(id);
    return member ? member : await guild.members.fetch(id);
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
  args: { error?: boolean; firstMsg?: boolean } = { error: false, firstMsg: false }
) {
  const embed = BasicEmbed(
    client,
    args.error ? "Error" : title,
    message.toString(),
    undefined,
    args.error ? "Red" : "Green"
  );

  if (args.firstMsg) {
    return await interaction.reply({
      content: "",
      embeds: [],
    });
  }
  await interaction.editReply({
    content: "",
    embeds: [embed],
  });
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
