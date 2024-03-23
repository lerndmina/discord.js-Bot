import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import log from "fancy-log";
import { globalCooldownKey, setCommandCooldown, waitingEmoji } from "../../Bot";
import ParseTimeFromMessage from "../../utils/ParseTimeFromMessage";
import BasicEmbed from "../../utils/BasicEmbed";
import { lastRestart } from "../../events/ready/loggedIn";
import { msToTime } from "../../utils/TinyUtils";

export const data = new SlashCommandBuilder()
  .setName("uptime")
  .setDescription("Get the uptime of the bot.")
  .setDMPermission(false);

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
};

export async function run({ interaction, client, handler }: SlashCommandProps) {
  return interaction.reply({
    embeds: [
      BasicEmbed(client, "Uptime", `I have been online for ${msToTime(Date.now() - lastRestart)}`),
    ],
  });
}
