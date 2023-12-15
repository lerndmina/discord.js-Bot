import { Client, GatewayIntentBits, Partials } from "discord.js";
import { CommandKit } from "commandkit";
import path from "path";
import * as log from "fancy-log";
import mongoose from "mongoose";
import { config as dotenvConfig } from "dotenv";
import { createClient } from "redis";
import { fetchEnvs } from "./utils/FetchEnvs";
const env = fetchEnvs();

export const Start = async () => {
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

  log.info(`Logging in to Discord with ${Object.keys(env).length} enviroment variables.`);

  await mongoose.connect(env.MONGODB_URI).then(() => {
    log.info("Connected to MongoDB");
    client.login(env.BOT_TOKEN);
  });

  await redisClient.connect();
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
 * @description Home url for lerndmina
 */
export const BOT_URL: string = env.BOT_URL;

export const ROLE_BUTTON_PREFIX = "roleGive-";


export const waitingEmoji: string = env.WAITING_EMOJI;

var _commandCooldown = new Map();

export const getKeyString = function (commandName: string, interaction: import("discord.js").Interaction): string {
  return `${commandName}-${interaction.user.id}`;
};

export const getCommandCooldownMap = function (): Map<string, number> {
  return _commandCooldown;
};

export const getCommandCooldown = function (key: string): number | undefined {
  return _commandCooldown.get(key);
};

export const setCommandCooldown = function (key: string, value: number) {
  _commandCooldown.set(key, value);
};

export const deleteCommandCooldownKey = function (key: string): boolean {
  return _commandCooldown.delete(key);
};

export const redisClient = createClient({
  url: env.REDIS_URL,
})
  .on("error", (err) => {
    log.error("Redis Client Error", err);
    process.exit(1);
  })
  .on("ready", () => log.info("Redis Client Ready"));

Start();
