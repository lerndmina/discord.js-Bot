const { Client, Collection, Events, GatewayIntentBits, Partials, MessageType, MessageFlags, ActivityType } = require("discord.js");
const { CommandKit } = require("commandkit");
const path = require("path");
const log = require("fancy-log");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;
const TEST_SERVER = process.env.GUILD_ID;

const ready = require("./events/ready/loggedIn");
const onMessage = require("./events/messageCreate/onMessage");
const CheckEnvs = require("./utils/CheckEnvs");

log("Bot is starting...");

// Check all required environment variables are set
CheckEnvs();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

new CommandKit({
  client, // Discord.js client object | Required by default
  commandsPath: path.join(__dirname, "commands"), // The commands directory
  eventsPath: path.join(__dirname, "events"), // The events directory
  validationsPath: path.join(__dirname, "validations"), // Only works if commandsPath is provided
  devGuildIds: [TEST_SERVER],
  devUserIds: [OWNER_ID],
});

client.login(BOT_TOKEN);
