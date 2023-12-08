const { SlashCommandBuilder, Message } = require("discord.js");
const log = require("fancy-log");
const { ROLE_BUTTON_PREFIX, waitingEmoji } = require("../../Bot");
const RoleButtons = require("../../models/RoleButtons");
const BasicEmbed = require("../../utils/BasicEmbed");
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

    // Loop through all messages in the channel
    var messages = await channel.messages.fetch();
    messages.forEach(async (message) => {
      if (!(message.components.length > 0)) return;
      message.components.forEach(async (component) => {
        if (!(component.components.length > 0)) return;
        component.components.forEach(async (subcomponent) => {
          if (!subcomponent.data.custom_id.startsWith(ROLE_BUTTON_PREFIX)) return;
          const uuid = subcomponent.data.custom_id.split("-").slice(1).join("-");
          log("Deleting button: " + uuid);
          cleaned++;
          const errors = await deleteMessageRemoveFromDB(message, uuid);
          interaction.editReply({
            content: "Done!",
            embeds: [
              BasicEmbed(
                client,
                "Role Button Cleanup",
                `Deleted button: ${uuid}${errors ? `\n\nErrors:\n${errors}` : ""}`
              ),
            ],
          });
        });
      });
    });
    if (cleaned == 0) {
      await interaction.editReply({
        content: "",
        embeds: [
          BasicEmbed(client, "Role Button Cleanup", "No buttons found to clean up.", "Random"),
        ],
      });
    }
  },
};

/**
 *
 * @param {Message} message
 * @param {import("crypto").UUID} uuid
 */
async function deleteMessageRemoveFromDB(message, uuid) {
  var errors = "";
  try {
    await message.delete();
  } catch (error) {
    log("Error deleting message: " + message.id + " " + error);
    errors +=
      "Can't delete message, it either doesn't exist or I don't have permission to delete it.\n";
  }
  const button = await RoleButtons.findOneAndDelete({ buttonId: uuid });
  if (!button) {
    log("Error deleting button: " + uuid);
    errors += "The button does not exist in the database.";
  }
  return errors;
}
