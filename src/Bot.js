const { Client, Collection, Events, GatewayIntentBits, Partials, MessageType, MessageFlags, ActivityType } = require("discord.js");
const { CommandKit } = require("commandkit");
const path = require("path");
const log = require("fancy-log");
require("dotenv").config();

const env = require("./utils/FetchEnvs")();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

// Using CommandKit (https://commandkit.underctrl.io)
const commandKit = new CommandKit({
  client, // Discord.js client object | Required by default
  commandsPath: path.join(__dirname, "commands"), // The commands directory
  eventsPath: path.join(__dirname, "events"), // The events directory
  validationsPath: path.join(__dirname, "validations"), // Only works if commandsPath is provided
  devGuildIds: env.TEST_SERVERS,
  devUserIds: env.OWNER_IDS,
});

log.info(`Logging in to Discord with ${commandKit.commands.length} commands and ${Object.keys(env).length} enviroment variables.`);

client.login(env.BOT_TOKEN);
