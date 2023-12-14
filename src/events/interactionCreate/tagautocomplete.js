const { BaseInteraction, Client, AutocompleteInteraction } = require("discord.js");
const log = require("fancy-log");
const TagSchema = require("../../models/TagSchema");
const { upperCaseFirstLetter, getTagKey, getTagName, debugMsg } = require("../../utils/TinyUtils");
const { redisClient } = require("../../Bot");
const { Database } = require("../../utils/cache/database");
const COMMAND_NAME = "tag";
/**
 *
 * @param {AutocompleteInteraction}
 * @param {Client} client
 */
module.exports = async (interaction, client) => {
  if (!interaction.isAutocomplete()) return;
  if (interaction.commandName !== COMMAND_NAME) return;

  /**
   * @type {String}
   */
  const rawFocusedValue = interaction.options.getFocused();
  if (!rawFocusedValue) return interaction.respond([]);
  const focusedValue = rawFocusedValue ? rawFocusedValue.trim().toLowerCase() : "";

  debugMsg(`Autocomplete call for: ${focusedValue}`);

  const db = new Database();

  const tags = await db.find(TagSchema, { guildId: interaction.guild.id }, false, 15);

  const data = [];
  if (tags && tags.length > 0 && focusedValue) {
    for (const tag of tags) {
      const tagName = getTagName(tag.key);
      if (!tagName.includes(focusedValue)) continue;
      data.push({
        name: tagName,
        value: tagName,
      });
    }
  }

  try {
    await interaction.respond(data);
  } catch (error) {
    log.error("We hit an emergency try/catch, error sending autocomplete response", error);
  }
};
