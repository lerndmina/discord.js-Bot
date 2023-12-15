import { SnowflakeUtil } from "discord.js";
import * as log from "fancy-log";

import dotenv from "dotenv";
dotenv.config();

export default function () {
  // Key value array to store the environment variables
  var env: {
  BOT_TOKEN: string,
  OWNER_IDS: string[],
  TEST_SERVERS: string[],
  PREFIX: string,
  OPENAI_API_KEY: string,
  MONGODB_URI: string,
  TENOR_API_KEY: string,
  WAITING_EMOJI: string,
  BOT_URL: string,
  REDIS_URL: string,
  DEBUG_LOG: boolean,
} = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  OWNER_IDS: (process.env.OWNER_IDS || '').split(","),
  TEST_SERVERS: (process.env.TEST_SERVERS || '').split(","),
  PREFIX: process.env.PREFIX || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  TENOR_API_KEY: process.env.TENOR_API_KEY || '',
  WAITING_EMOJI: process.env.WAITING_EMOJI || '',
  BOT_URL: process.env.BOT_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  DEBUG_LOG: process.env.DEBUG_LOG === "true", 
};

for (const key in env) {
  if (env[key as keyof typeof env] === undefined || env[key as keyof typeof env] === null || env[key as keyof typeof env] === "") {
    log.error(`Env ${key} does not exist or is empty.`);
    process.exit(1);
  }
}
  const DISCORD_EPOCH = 1420070400000;
  // Check if the owner and server ids are snowflakes
  env.TEST_SERVERS.forEach((id) => {
    const snowflake = SnowflakeUtil.deconstruct(id);
    if (snowflake.timestamp < DISCORD_EPOCH) { // Discord Epoch (2015-01-01)
      log.error(`Env TEST_SERVERS contains an invalid snowflake: ${id}`);
      process.exit(1);
    }
  });
  
  env.OWNER_IDS.forEach((id) => {
    const snowflake = SnowflakeUtil.deconstruct(id);
    if (snowflake.timestamp < DISCORD_EPOCH) { // Discord Epoch (2015-01-01)
      log.error(`Env OWNER_IDS contains an invalid snowflake: ${id}`);
      process.exit(1);
    }
  });

  return env;
};
