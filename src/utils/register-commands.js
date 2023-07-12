const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
var log = require('fancy-log');

require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;

const syncCommands = async (message) => {
  var isError = false;
  const commands = [];
  // Grab all the command files from the commands directory you created earlier
  const foldersPath = path.join(__dirname, "../commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
      } else {
        log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(BOT_TOKEN);

  // Delete all global commands for the application
  try {
    log("Started deleting global commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
  } catch (error) {
    log.error("Failed to delete global commands:", error);
    isError = true;
    return;
  }

  // and deploy your commands!
  try {
    log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

    log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    log.error(error);
    isError = true;
  }
  if (isError) {
    message.reply("There was an error while syncing commands. Please check the console for more information.");
  } else {
  message.reply(`Successfully synced ${commands.length} commands.`)
    .then((reply) => {
      // Delete the reply and the original message after 3 seconds
      setTimeout(() => {
        reply.delete();
        message.delete();
      }, 3000);
    });
}
};

module.exports = syncCommands;
