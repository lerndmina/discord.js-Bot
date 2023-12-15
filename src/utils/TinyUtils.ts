import { Client, Snowflake, Guild, User, Channel, ClientApplication, BaseInteraction, Interaction, CommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, InteractionReplyOptions, Base, RepliableInteraction } from "discord.js";
import FetchEnvs from "./FetchEnvs";
import log from "fancy-log";
import BasicEmbed from "./BasicEmbed";
import { Url } from "url";

const env = FetchEnvs();

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

export class ThingGetter {
  typeMap: { users: string; channels: string; guilds: string; };
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
    return this.#get(id, "users");
  }


  async getChannel(id: Snowflake) {
    return this.#get(id, "channels");
  }


  async getGuild(id: Snowflake) {
    return this.#get(id, "guilds");
  }


  async getMember(guild: Guild, id: Snowflake) {
    const member = guild.members.cache.get(id);
    return member ? member : await guild.members.fetch(id);
  }

  async #get(id: Snowflake, type: ("users" | "channels" | "guilds")) {
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

export function debugMsg (msg: string | Object) {
  if (!env.DEBUG_LOG) return;
  if (msg instanceof Object) {
    log.info(msg);
  } else {
    log.info(`DEBUG: ${msg}`);
  }
};


export async function returnMessage (
  interaction: RepliableInteraction,
  client: Client<true>,
  title: string,
  message: string,
  args: { error: boolean; firstMsg: boolean; } = { error: false, firstMsg: false }
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
};

export function getTagKey (guildId: Snowflake, tagName: string) {
  return `${guildId}:${tagName}`;
};

export function upperCaseFirstLetter(string: string) {
  if (!string) return;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * @description Replaces all occurrences of the literal string "\n" with the newline character in the given string.
 */
export function parseNewlines (string: string) {
  return string.replace(/\\n/g, "\n");
};

export function getTagName (tagKey: string) {
  return tagKey.split(":")[1];
};
