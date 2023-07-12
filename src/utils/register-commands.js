const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
var log = require("fancy-log");
const DeleteMessage = require("./DeleteMessage");
const BasicEmbed = require("./BasicEmbed");

require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;

const syncCommands = async (client, message, guildId, delGlobal) => {
  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(BOT_TOKEN);

  if (delGlobal) {
    try {
      await message.channel.send("Deleting guild's commands...");
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: [] });
      await message.channel.send("Guild's commands deleted.");
      return;
    } catch (error) {
      log.error(error);
      await message.channel.send("Error deleting commands.");
      return;
    }
  }

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

  // Delete all guild commands for the application before deploying new ones
  try {
    log("Started deleting guild commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: [] });
  } catch (error) {
    log.error("Failed to delete guild commands:", error);
    isError = true;
    return;
  }

  // and deploy your commands!
  try {
    log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands });

    log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    log.error(error);
    isError = true;
  }
  if (isError) {
    message.reply("There was an error while syncing commands. Please check the console for more information.");
  } else {
    // Get guild from id
    const guild = await message.client.guilds.fetch(guildId);
    message.reply({ embeds: [BasicEmbed(client, "Synced Commands", `Successfully synced ${commands.length} commands.`)] });
  }
};

module.exports = syncCommands;
