const { Client, Collection, Events, GatewayIntentBits, Partials, MessageType, MessageFlags, ActivityType } = require("discord.js");
const { CommandKit } = require("commandkit");
const path = require("path");
const log = require("fancy-log");
require("dotenv").config();

// Key value array to store the environment variables
const env = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  OWNER_IDS: process.env.OWNER_IDS,
  TEST_SERVERS: process.env.GUILD_IDS,
  PREFIX: process.env.PREFIX,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

const CheckEnvs = require("./utils/CheckEnvs");

log("Bot is starting...");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

new CommandKit({
  client, // Discord.js client object | Required by default
  commandsPath: path.join(__dirname, "commands"), // The commands directory
  eventsPath: path.join(__dirname, "events"), // The events directory
  validationsPath: path.join(__dirname, "validations"), // Only works if commandsPath is provided
  devGuildIds: [env.TEST_SERVERS],
  devUserIds: [env.OWNER_IDS],
});

client.login(env.BOT_TOKEN);
