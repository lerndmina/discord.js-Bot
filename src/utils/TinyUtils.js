const { Client, Snowflake } = require("discord.js");
const env = require("./FetchEnvs")();
const log = require("fancy-log");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports.sleep = sleep;

async function postWebhookToThread(url, threadId, content) {
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

module.exports.postWebhookToThread = postWebhookToThread;

class ThingGetter {
  /**
   * @param {Client} client
   */
  constructor(client) {
    this.client = client;
    this.typeMap = {
      user: "users",
      channel: "channels",
      guild: "guilds",
    };
  }

  /**
   * @param {Snowflake} id
   */
  async getUser(id) {
    return this.#get(id, "user");
  }

  /**
   * @param {Snowflake} id
   */
  async getChannel(id) {
    return this.#get(id, "channel");
  }

  /**
   * @param {Snowflake} id
   */
  async getGuild(id) {
    return this.#get(id, "guild");
  }

  /**
   * @param {Snowflake} id
   * @param {("user"|"channel"|"guild")} type
   */
  async #get(id, type) {
    const property = this.typeMap[type];
    if (!property) {
      throw new Error(`Invalid type: ${type}`);
    }

    let thing = this.client[property].cache.get(id);
    if (!thing) {
      thing = await this.client[property].fetch(id);
    }
    return thing;
  }
}

module.exports.ThingGetter = ThingGetter;

module.exports.debugMsg = function (msg) {
  if (!env.DEBUG_LOG) return;
  if (msg instanceof Object) {
    log.info(msg);
  } else {
    log.info(`DEBUG: ${msg}`);
  }
};
