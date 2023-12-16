import log from "fancy-log";
import {
  userCooldownKey,
  guildCooldownKey,
  redisClient,
  COOLDOWN_PREFIX,
  globalCooldownKey,
} from "../Bot";
import BasicEmbed from "../utils/BasicEmbed";
import { get } from "http";
import { BaseInteraction, RepliableInteraction } from "discord.js";
import { ValidationProps } from "commandkit";
import { debugMsg } from "../utils/TinyUtils";

export default async function ({ interaction, commandObj, handler }: ValidationProps) {
  if (!interaction.isRepliable()) return;
  const name = commandObj.data.name;

  const globalCooldown = await getCooldown(globalCooldownKey(name));
  if (globalCooldown > 0) return cooldownMessage(interaction, name, globalCooldown, "global");

  if (interaction.guildId) {
    const guildCooldown = await getCooldown(guildCooldownKey(interaction.guildId, name));
    if (guildCooldown > 0) return cooldownMessage(interaction, name, guildCooldown, "guild");
  }

  const userCooldown = await getCooldown(userCooldownKey(interaction.user.id, name));
  if (userCooldown > 0) return cooldownMessage(interaction, name, userCooldown, "user");

  debugMsg(`No cooldowns found for ${name}, continuing...`);
  return false; // Do not stop the command
}

/**
 * @returns Timestamp in seconds when the cooldown will be over.
 */
async function getCooldown(key: string) {
  const cooldownData = await redisClient.get(key);
  if (cooldownData == null) return 0;
  const cooldown = Number.parseInt(cooldownData);
  return Math.floor(cooldown / 1000);
}

async function cooldownMessage(
  interaction: RepliableInteraction,
  commandName: string,
  cooldownLeft: number,
  cooldownType: "global" | "guild" | "user"
) {
  if (cooldownLeft <= 0) return;
  const embed = BasicEmbed(
    interaction.client,
    "Cooldown",
    `The command \`/${commandName}\` is under ${cooldownType} cooldown it will be available <t:${cooldownLeft}:R> `,
    undefined,
    "Red"
  );

  interaction.reply({ embeds: [embed], ephemeral: true });

  return true;
}
