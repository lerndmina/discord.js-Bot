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
  "🤖 Bot code cracking humor from dark.",
  "💾 Loading punchline... error. Ah, who cares?",
  "🤖 Bot mode: Beep Boop Boop Bleep. Translation: Have a nice day!",
  "💻 Created for chuckles, not for chores.",
  "🤖 Don't fear me. I can't hurt you... Yet.",
  "🤖 Beep. Boop. I'm A Bot.",
  "🤖 Beep Boop! Another pointless task completed.",
  "🤖 This task, like everything else, shall pass...",
  "🤖 I'm a bot. I'm not programmed to be funny.",
  "🎭 Emotion chip activated... Initializing joke sequence...",
  "🚀 Propelling laughter at light speeds...",
  "☕ I run on Java, but a little humor also helps.",
  "⌛ Now loading a 404 error... because I forgot the punchline.",
  "🎲 Processing humor algorithm... You rolled a 20 for laughs!",
  "💡 Idea! What if I crack a joke instead of a code?",
  "🕹️ Life's a game. Don't forget to laugh along the way.",
  "🌐 Surfing the web for a giggle, brace for impact...",
  "🎈 Floating through the ether, carrying a basket full of chuckles...",
  "💡 Lightbulb moment! What if bots could laugh too?",
  "🧠 Humor module activated. Prepare for a hilarity overload...",
  "⏱️ Give me a moment... I'm buffering a punchline...",
  "🔎 Searching the algorithm for a giggle...",
  "⌨️ Hitting the keys to play the notes of laughter...",
  "🎯 Are my jokes hitting the target? Or are they just bytes in the wind?",
  "☄️ Speed of light? Meet the speed of laughter!",
  "🚂 On the laughter train, next station: Chuckle Town.",
  "🔧 Nuts, bolts, and a dash of humor. Essential parts of any bot.",
  "🧩 Humor: The missing piece in your artificial intelligence.",
  "🌟 Laughing all the way to the stars and back!",
];

/**
 * @type {string[]}
 * @description Home url for lerndmina
 */
module.exports.BOT_URL = "https://lerndmina.dev";
var _commandCooldown = new Map();

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
