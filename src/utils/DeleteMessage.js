const { DiscordAPIError } = require("discord.js");
const log = require("fancy-log");

module.exports = async (message) => {
  try {
    await message.delete();
  } catch (error) {
    if (error instanceof DiscordAPIError) {
      log.error(`Discord API Error: ${error.message}`);
    }
  }
};
