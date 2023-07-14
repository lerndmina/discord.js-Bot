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
  };

  for (const key in env) {
    if (env[key] === undefined) {
      log.error(`Env ${key} is not defined.`);
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

  // Check the token is a valid discord bot token
  const tokenRegex = /^[a-zA-Z0-9]*\.[a-zA-Z0-9]*\.[a-zA-Z0-9]*$/;
  if (!tokenRegex.test(env.BOT_TOKEN)) {
    console.log("Invalid Discord bot token detected. Please check your .env file. Add your bot token to the BOT_TOKEN variable.");
    process.exit(1);
  }

  return env;
};
