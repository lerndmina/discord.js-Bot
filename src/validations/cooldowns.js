const log = require("fancy-log");
const { getCommandCooldown, deleteCommandCooldownKey, getKeyString } = require("../Bot");
const BasicEmbed = require("../utils/BasicEmbed");
const { get } = require("http");

module.exports = ({ interaction, commandObj, handler }) => {
  const name = commandObj.data.name;

  const now = Date.now();
  const globalCooldown = getCommandCooldown(name);
  const userKey = getKeyString(name, interaction);
  const userCooldown = getCommandCooldown(userKey);

  if (globalCooldown) {
    if (now < globalCooldown) {
      return hasCooldownMessage(interaction, globalCooldown);
    } else {
      deleteCommandCooldownKey(name);
    }
  } else if (userCooldown) {
    if (now < userCooldown) {
      return hasCooldownMessage(interaction, userCooldown);
    } else {
      deleteCommandCooldownKey(userKey);
    }
  }
};

function hasCooldownMessage(interaction, time) {
  const timeLeft = Math.floor(time / 1000);
  return interaction.reply({
    embeds: [
      BasicEmbed(
        interaction.client,
        "Cooldown",
        `This command has a rate limit, you will be able to use this command <t:${timeLeft}:R>.`,
        "Red"
      ),
    ],
    ephemeral: true,
  });
}
