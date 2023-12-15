import log from "fancy-log";
import { getCommandCooldown, deleteCommandCooldownKey, getKeyString } from "../Bot";
import BasicEmbed from "../utils/BasicEmbed";
import { get } from "http";
import { ValidationFunctionProps } from "commandkit";
import { BaseInteraction, RepliableInteraction } from "discord.js";

export default function ({ interaction, commandObj, handler }: ValidationFunctionProps){
  const name = commandObj.data.name;

  const now = Date.now();
  const globalCooldown = getCommandCooldown(name);
  const userKey = getKeyString(name, interaction);
  const userCooldown = getCommandCooldown(userKey);

  if (globalCooldown) {
    if (now < globalCooldown) {
      return hasCooldownMessage(interaction as RepliableInteraction, globalCooldown);
    } else {
      deleteCommandCooldownKey(name);
    }
  } else if (userCooldown) {
    if (now < userCooldown) {
      return hasCooldownMessage(interaction as RepliableInteraction, userCooldown);
    } else {
      deleteCommandCooldownKey(userKey);
    }
  }
};

function hasCooldownMessage(interaction: RepliableInteraction, time: number) {
  const timeLeft = Math.floor(time / 1000);
  return interaction.reply({
    embeds: [
      BasicEmbed(
        interaction.client,
        "Cooldown",
        `This command has a rate limit, you will be able to use this command <t:${timeLeft}:R>.`,
        undefined,
        "Red"
      ),
    ],
    ephemeral: true,
  });
}
