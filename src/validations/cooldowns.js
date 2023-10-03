const log = require("fancy-log");
const { getCommandCooldown } = require("../Bot");
const BasicEmbed = require("../utils/BasicEmbed");

module.exports = ({ interaction, commandObj, handler }) => {
  const name = commandObj.data.name;

  cooldown = getCommandCooldown();

  const now = Date.now();

  if (cooldown.has(name)) {
    const time = cooldown.get(name);

    if (now < time) {
      const timeLeft = Math.floor(time / 1000);
      return hasCooldownMessage(interaction, timeLeft);
    } else {
      cooldown.delete(name);
    }
  } else if (cooldown.has(`${name}-${interaction.user.id}`)) {
    const time = cooldown.get(`${name}-${interaction.user.id}`);
    if (now < time) {
      const timeLeft = Math.floor(time / 1000);
      return hasCooldownMessage(interaction, timeLeft);
    } else {
      cooldown.delete(`${name}-${interaction.user.id}`);
    }
  }
};

function hasCooldownMessage(interaction, timeLeft) {
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
