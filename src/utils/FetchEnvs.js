const { env } = require("process");
const log = require("fancy-log");

require("dotenv").config();
module.exports = () => {
  // Key value array to store the environment variables
  var env = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    OWNER_IDS: process.env.OWNER_IDS,
    TEST_SERVERS: process.env.TEST_SERVERS,
    PREFIX: process.env.PREFIX,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MONGODB_URI: process.env.MONGODB_URI,
    TENOR_API_KEY: process.env.TENOR_API_KEY,
    WAITING_EMOJI: process.env.WAITING_EMOJI,
    BOT_URL: process.env.BOT_URL,
    REDIS_URL: process.env.REDIS_URL,
    DEBUG_LOG: process.env.DEBUG_LOG,
  };

  if (env.DEBUG_LOG !== "true" && env.DEBUG_LOG !== "1") {
    env.DEBUG_LOG = false;
  }

  for (const key in env) {
    if (env[key] === undefined || env[key] === null || env[key] === "") {
      log.error(`Env ${key} does not exist or is empty.`);
      process.exit(1);
    }
  }

  env.OWNER_IDS = env.OWNER_IDS.split(",");
  env.TEST_SERVERS = env.TEST_SERVERS.split(",");

  // if ownerids or test servers are not arrays make them arrays
  if (!Array.isArray(env.OWNER_IDS)) env.OWNER_IDS = [env.OWNER_IDS];
  if (!Array.isArray(env.TEST_SERVERS)) env.TEST_SERVERS = [env.TEST_SERVERS];

  // Check if the owner and server ids are snowflakes
  env.TEST_SERVERS.forEach((id) => {
    if (isNaN(id)) {
      log.error(`Env TEST_SERVERS contains a non-number value: ${id}`);
      process.exit(1);
    }
  });

  env.OWNER_IDS.forEach((id) => {
    if (isNaN(id)) {
      log.error(`Env OWNER_IDS contains a non-number value: ${id}`);
      process.exit(1);
    }
  });

  return env;
};
