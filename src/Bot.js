const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { CommandKit } = require("commandkit");
const path = require("path");
const log = require("fancy-log");
const mongoose = require("mongoose");
require("dotenv").config();

const env = require("./utils/FetchEnvs")();

module.exports.Start = async () => {
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

  await mongoose.connect(env.MONGODB_URI).then(() => {
    log.info("Connected to MongoDB");
    client.login(env.BOT_TOKEN);
  });
};

/**
 * @type {string[]}
 * @description Random funny bot messages for a footer.
 */
module.exports.BOT_MESSAGES = [
  "🤖 Humor capacity overload. Please stand by...",
  "🤖 Don't mind me. Just your friendly neighbourhood bot.",
  "🤖 Turning caffeine into code.",
  "⚡ Powered by logic, love and a dash of lunacy.",
  "🤖 Bot mode: Beep Boop Boop Bleep. Translation: Have a nice day!",
  "💻 Created for chuckles, not for chores.",
  "🤖 Don't fear me. I can't hurt you... Yet.",
  "🤖 Beep. Boop. I'm a Bot.",
  "🤖 Beep Boop! Another pointless task completed.",
  "🤖 This task, like everything else, shall pass...",
  "🤖 I'm a bot. I'm not programmed to be funny.",
  "☕ I run on Javaˢᶜʳᶦᵖᵗ, but a little humor also helps.",
  "⏱️ Give me a moment... I'm buffering a punchline...",
];

/**
 * @type {string[]}
 * @description Home url for lerndmina
 */
module.exports.BOT_URL = "https://lerndmina.dev";
var _commandCooldown = new Map();

module.exports.ROLE_BUTTON_PREFIX = "roleGive-";

/**
 * @type {String}
 * @description Waiting emoji
 */
module.exports.waitingEmoji = "<a:waiting:1182794459272974416>";

/**
 *
 * @returns {Map}
 */
module.exports.getCommandCooldown = function () {
  return _commandCooldown;
};

/**
 *
 * @param {Map} value
 */
module.exports.setCommandCooldown = function (value) {
  _commandCooldown = value;
};

this.Start();
