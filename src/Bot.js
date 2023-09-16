const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { CommandKit } = require("commandkit");
const path = require("path");
const log = require("fancy-log");
const mongoose = require("mongoose");
require("dotenv").config();

const env = require("./utils/FetchEnvs")();

/**
 * @param {Client} client
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
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

log.info(
  `Logging in to Discord with ${commandKit.commands.length} commands and ${
    Object.keys(env).length
  } enviroment variables.`
);

mongoose.connect(env.MONGODB_URI).then(() => {
  log.info("Connected to MongoDB");
  client.login(env.BOT_TOKEN);
});
