const { Client, Snowflake, Guild } = require("discord.js");
const env = require("./FetchEnvs")();
const log = require("fancy-log");
const BasicEmbed = require("./BasicEmbed");

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
   * @returns {User}
   */
  async getUser(id) {
    return this.#get(id, "user");
  }

  /**
   * @param {Snowflake} id
   * @returns {Channel}
   */
  async getChannel(id) {
    return this.#get(id, "channel");
  }

  /**
   * @param {Snowflake} id
   * @returns {Guild}
   */
  async getGuild(id) {
    return this.#get(id, "guild");
  }

  /**
   * @param {Guild} guild
   * @param {Snowflake} id
   * @returns {GuildMember}
   */
  async getMember(guild, id) {
    const member = guild.members.cache.get(id);
    return member ? member : await guild.members.fetch(id);
  }

  /**
   * @param {Snowflake} id
   * @param {("user"|"channel"|"guild")} type
   */
  async #get(id, type) {
    var start = env.DEBUG_LOG ? Date.now() : undefined;
    const property = this.typeMap[type];
    if (!property) {
      throw new Error(`Invalid type: ${type}`);
    }

    let thing = this.client[property].cache.get(id);
    if (!thing) {
      thing = await this.client[property].fetch(id);
    }
    if (env.DEBUG_LOG) debugMsg(`ThingGetter - Time taken: ${Date.now() - start}ms`);
    return thing;
  }
}

module.exports.ThingGetter = ThingGetter;

const debugMsg = function (msg) {
  if (!env.DEBUG_LOG) return;
  if (msg instanceof Object) {
    log.info(msg);
  } else {
    log.info(`DEBUG: ${msg}`);
  }
};

module.exports.debugMsg = debugMsg;

/**
 *
 * @param {BaseInteraction} interaction
 * @param {Client} client
 * @param {String} title
 * @param {String} message
 * @param {Object} args
 * @param {boolean} args.error
 * @param {boolean} args.firstMsg
 * @returns
 */
const returnMessage = async function (
  interaction,
  client,
  title,
  message,
  args = { error: false, firstMsg: false }
) {
  const embed = BasicEmbed(
    client,
    args.error ? "Error" : title,
    message.toString(),
    args.error ? "RED" : "GREEN"
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

module.exports.returnMessage = returnMessage;

const getTagKey = function (guildId, tagName) {
  return `${guildId}:${tagName}`;
};

module.exports.getTagKey = getTagKey;

/**
 * @param {String} string - The string to uppercase
 * @returns {String} - The string with the first letter uppercased
 */
function upperCaseFirstLetter(string) {
  if (!string) return;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports.upperCaseFirstLetter = upperCaseFirstLetter;

/**
 * Replaces all occurrences of the literal string "\n" with the newline character in the given string.
 *
 * @param {String} string - The string to parse.
 * @returns {String} The parsed string.
 */
const parseNewlines = function (string) {
  return string.replace(/\\n/g, "\n");
};

module.exports.parseNewlines = parseNewlines;

/**
 * @param {String} tagKey - The tag key to get the tag name from
 * @returns {String} - The tag name
 */
const getTagName = function (tagKey) {
  if (!tagKey) return;
  return tagKey.split(":")[1];
};

module.exports.getTagName = getTagName;
