const { Client, Collection, Events, GatewayIntentBits, Partials, Message, MessageType, MessageFlags } = require("discord.js");
var log = require("fancy-log");

require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;
const PREFIX = process.env.PREFIX;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Check all required environment variables are set
if (!BOT_TOKEN) {
  log.error("Missing BOT_TOKEN environment variable.");
  process.exit(1);
}
if (!OWNER_ID) {
  log.error("Missing OWNER_ID environment variable.");
  process.exit(1);
}
if (!PREFIX) {
  log.error("Missing PREFIX environment variable.");
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  log.error("Missing OPENAI_API_KEY environment variable.");
  process.exit(1);
}

const fs = require("fs");
const path = require("node:path");
const onMention = require("./listeners/onMention");
const ready = require("./listeners/ready");
const syncCommands = require("./utils/register-commands");
const TranscribeMessage = require("./utils/TranscribeMessage");
const DeleteMessage = require("./utils/DeleteMessage");

log("Bot is starting...");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Handle interaction create events
client.on(Events.InteractionCreate, async (interaction) => {
  var isError = false;
  var errorContent;
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      log.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      errorContent = error;
      isError = true;
    }
  } else if (interaction.isContextMenuCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      log.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      isError = true;
      errorContent = error;
    }
  }

  // Handle errors
  if (!isError) return;
  await interactionErrror(errorContent, interaction);
});

// When the owener sends the command "!sync" in dms the bot will sync the commands
client.on(Events.MessageCreate, async (message) => {
  if (message.guildId === "856937743543304203") return;

  if (message.author.bot) return;
  // if (message.channel.type != ChannelType.DM) return;
  if (message.content == `${PREFIX}sync`) {
    if (message.author.id != OWNER_ID) return;
    syncCommands(message);
  } else if (message.content == `${PREFIX}reboot`) {
    if (message.author.id != OWNER_ID) return;
    await message.reply("Rebooting...");
    setTimeout(() => {
      DeleteMessage(message);
    }, 1000);
    log("Rebooting...");
    process.exit(0);
  } else if (message.type == MessageType.Reply) {
    const channel = message.channel;
    const repliedMessage = await channel.messages.fetch(message.reference.messageId);
    if (repliedMessage.author.id == client.user.id) {
      onMention(client, message, OPENAI_API_KEY);
    }
  } else if (message.content.includes(client.user.id)) {
    onMention(client, message, OPENAI_API_KEY);
  } else if (message.flags == MessageFlags.IsVoiceMessage && message.attachments.size == 1) {
    // if message has reactions then return
    if (message.reactions.cache.size > 0) return;

    // if message has no reactions then react with ✍️ and ❌
    if (message.reactions.cache.size == 0) {
      message.react("✍️");
      TranscribeMessage(client, message, OPENAI_API_KEY);
    }
  }
});

ready(client);

client.login(BOT_TOKEN);

async function interactionErrror(errorContent, interaction) {
  const errorMsg = "There was an error while executing this command! Please inform the bot owner.";
  log.error(errorContent);
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content: errorMsg, ephemeral: true });
  } else {
    await interaction.reply({ content: errorMsg, ephemeral: true });
  }
}
