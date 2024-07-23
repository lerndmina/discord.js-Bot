import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import { SlashCommandBuilder, EmbedBuilder, userMention } from "discord.js";
import log from "fancy-log";
import { globalCooldownKey, setCommandCooldown, waitingEmoji } from "../../Bot";
import { ThingGetter, tsToDiscordTimestamp } from "../../utils/TinyUtils";
import MutedUserSchema, { MutedUserType } from "../../models/MutedUserSchema";
import Database from "../../utils/data/database";
import BasicEmbed from "../../utils/BasicEmbed";
import FetchEnvs from "../../utils/FetchEnvs";

export const data = new SlashCommandBuilder()
  .setName("history")
  .setDescription("Get the moderation history of a user.")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to get the history of.").setRequired(true)
  )
  .addBooleanOption((option) =>
    option.setName("private").setDescription("Make the response private.").setRequired(false)
  )
  .setDMPermission(false);

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
};

const env = FetchEnvs();

export async function run({ interaction, client, handler }: SlashCommandProps) {
  const getter = new ThingGetter(client);

  const user = interaction.options.getUser("user", true);
  const ephemeral = interaction.options.getBoolean("private") || false;
  const member = await getter.getMember(interaction.guild!, user.id);

  if (!member) {
    return interaction.reply({ content: "User not found in this server.", ephemeral });
  }

  const db = new Database();

  // Clean the cache for this request otherwise we get strings for the dates instead of Date objects.
  db.cleanCache(env.MONGODB_DATABASE + ":MutedUser:userId:" + member.id);
  await setCommandCooldown(globalCooldownKey(interaction.commandName), 10);

  const mutes = (await db.find(MutedUserSchema, { userId: member.id })) as MutedUserType[];

  if (!mutes || mutes.length === 0) {
    return interaction.reply({
      content: "No moderation history found for this user.",
      ephemeral: true,
    });
  }

  const description = `User ID: ${member.id}, ${mutes.length} mutes found.\n\n${mutes
    .map((mute: MutedUserType) => {
      return `**Mute ID:** \`${mute.caseID}\`
        **Muted by:** ${userMention(mute.moderator)}
        **Reason:** \`${mute.reason}\`
        **Muted at:** ${tsToDiscordTimestamp(mute.mutedAt.getTime())}
        **Muted until:** ${tsToDiscordTimestamp(mute.mutedUntil.getTime())}\n\n`;
    })
    .join("")}\n`;

  if (description.length > 4096) {
    return interaction.reply({
      content: "The moderation history for this user is too long to send.",
      ephemeral,
    });
  }

  const embed = BasicEmbed(client, `Moderation history for ${member.user.tag}`, description);

  interaction.reply({ embeds: [embed], ephemeral });
}
