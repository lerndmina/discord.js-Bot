const { SlashCommandBuilder, Message } = require("discord.js");
const log = require("fancy-log");
const { ROLE_BUTTON_PREFIX, waitingEmoji } = require("../../Bot");
const RoleButtons = require("../../models/RoleButtons");
const BasicEmbed = require("../../utils/BasicEmbed");
const { Database } = require("../../utils/cache/database");
const { debugMsg } = require("../../utils/TinyUtils");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("cleanuprolebuttons")
    .setDescription(
      "Cleans up all role buttons in this channel and deletes the associated database entries"
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to clean up the buttons from")
        .setRequired(false)
    ),
  options: {
    devOnly: false,
    guildOnly: true,
    deleted: false,
    userPermissions: ["Administrator"],
  },
  run: async ({ interaction, client, handler }) => {
    await interaction.reply({ content: waitingEmoji, ephemeral: true });
    var cleaned = 0;

    var channel = interaction.options.getChannel("channel");
    if (!channel) channel = interaction.channel;
    var errors = "";
    // Loop through all messages in the channel.
    var messages = await channel.messages.fetch();
    messages.forEach(async (message) => {
      if (!(message.components.length > 0)) return;
      message.components.forEach(async (component) => {
        log("TESTING");
        if (!component.components[0].data.custom_id.startsWith(ROLE_BUTTON_PREFIX)) return;
        component.components.forEach(async (button) => {
          if (!button.data.custom_id.startsWith(ROLE_BUTTON_PREFIX)) return;
          const uuid = button.data.custom_id.split("-").slice(1).join("-");
          log("Deleting button: " + uuid);
          cleaned++;
          errors = await deleteFromDB(message, uuid);
        });
      });
      try {
        await message.delete();
      } catch (error) {
        log("Error deleting message: " + message.id + " " + error);
        errors += `\nCan't delete message, it either doesn't exist or I don't have permission to delete it.`;
      }
    });

    if (cleaned == 0) {
      await interaction.editReply({
        content: "",
        embeds: [
          BasicEmbed(client, "Role Button Cleanup", "No buttons found to clean up.", "Random"),
        ],
      });
    } else {
      interaction.editReply({
        content: "Done!",
        embeds: [
          BasicEmbed(
            client,
            "Role Button Cleanup",
            `Deleted ${cleaned} button(s)${errors ? ` :\n\nErrors:${errors}` : ""}`
          ),
        ],
      });
    }
  },
};

const db = new Database();

/**
 *
 * @param {Message} message
 * @param {import("crypto").UUID} uuid
 */
async function deleteFromDB(message, uuid) {
  const button = await db.deleteOne(RoleButtons, { buttonId: uuid });
  if (!button) {
    debugMsg("Error deleting button: " + uuid);
    var error = `\nThe button ${uuid} does not exist in the database.`;
  }
  return error;
}
