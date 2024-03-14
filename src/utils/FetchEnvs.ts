import { SnowflakeUtil } from "discord.js";
import * as log from "fancy-log";

import dotenv from "dotenv";
dotenv.config();

const OPTIONAL_STRING = "optional";

var accessedCount = 0;

export default function () {
  // Key value array to store the environment variables
  var env: {
    BOT_TOKEN: string;
    OWNER_IDS: string[];
    TEST_SERVERS: string[];
    PREFIX: string;
    OPENAI_API_KEY: string;
    MONGODB_URI: string;
    TENOR_API_KEY: string;
    WAITING_EMOJI: string;
    BOT_URL: string;
    REDIS_URL: string;
    DEBUG_LOG: boolean;
    MC_SERVER_IP: string;
    MC_SERVER_PORT: number;
    NAMELESS_API_KEY: string;
    IMGUR_CLIENT_ID: string;
    IMGUR_CLIENT_SECRET: string;
    MODMAIL_TABLE: string;
    DEFAULT_TIMEZONE: string;
  } = {
    BOT_TOKEN: process.env.BOT_TOKEN || "",
    OWNER_IDS: (process.env.OWNER_IDS || "").split(","),
    TEST_SERVERS: (process.env.TEST_SERVERS || "").split(","),
    PREFIX: process.env.PREFIX || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    MONGODB_URI: process.env.MONGODB_URI || "",
    TENOR_API_KEY: process.env.TENOR_API_KEY || "",
    WAITING_EMOJI: process.env.WAITING_EMOJI || "",
    BOT_URL: process.env.BOT_URL || "",
    REDIS_URL: process.env.REDIS_URL || "",
    DEBUG_LOG: process.env.DEBUG_LOG === "true",
    MC_SERVER_IP: process.env.MC_SERVER_IP || "",
    MC_SERVER_PORT: parseInt(process.env.MC_SERVER_PORT || "25565"),
    NAMELESS_API_KEY: process.env.NAMELESS_API_KEY || "",
    IMGUR_CLIENT_ID: process.env.IMGUR_CLIENT_ID || "",
    IMGUR_CLIENT_SECRET: process.env.IMGUR_CLIENT_SECRET || "",
    MODMAIL_TABLE: process.env.MODMAIL_TABLE || "",
    DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || "Europe/London",
  };

  var missingKeys: string[] = [];
  for (const key in env) {
    if (
      env[key as keyof typeof env] === undefined ||
      env[key as keyof typeof env] === null ||
      env[key as keyof typeof env] === ""
    ) {
      missingKeys.push(key);
    }
    if (env[key as keyof typeof env] === OPTIONAL_STRING) {
      if (accessedCount > 0) continue;
      log.warn(`Env ${key} is optional and is not set.`);
    }
  }
  if (missingKeys.length > 0) {
    log.error(`ENV ${missingKeys.join(", ")} are missing and are required.`);
    process.exit(1);
  }

  const DISCORD_EPOCH = 1420070400000;
  // Check if the owner and server ids are snowflakes
  env.TEST_SERVERS.forEach((id) => {
    const snowflake = SnowflakeUtil.deconstruct(id);
    if (snowflake.timestamp < DISCORD_EPOCH) {
      // Discord Epoch (2015-01-01)
      log.error(`Env TEST_SERVERS contains an invalid snowflake: ${id}`);
      process.exit(1);
    }
  });

  env.OWNER_IDS.forEach((id) => {
    const snowflake = SnowflakeUtil.deconstruct(id);
    if (snowflake.timestamp < DISCORD_EPOCH) {
      // Discord Epoch (2015-01-01)
      log.error(`Env OWNER_IDS contains an invalid snowflake: ${id}`);
      process.exit(1);
    }
  });

  accessedCount++;
  return env;
}
