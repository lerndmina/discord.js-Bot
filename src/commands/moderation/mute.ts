import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  GuildMember,
  userMention,
} from "discord.js";
import log from "fancy-log";
import { globalCooldownKey, setCommandCooldown, waitingEmoji } from "../../Bot";
import ParseTimeFromMessage from "../../utils/ParseTimeFromMessage";
import SecondsFromTime from "../../utils/SecondsFromTime";
import { debugMsg, ThingGetter } from "../../utils/TinyUtils";
import Database from "../../utils/data/database";
import MuteRoleSchema, { MuteRoleType } from "../../models/MuteRoleSchema";
import { randomUUID } from "crypto";
import MutedUserSchema from "../../models/MutedUserSchema";
import { waitToUnmute } from "../../events/ready/checkmutes";
import BasicEmbed from "../../utils/BasicEmbed";

export const data = new SlashCommandBuilder()
  .setName("mute")
  .setDescription("Mute a user")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to mute").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("The reason for the mute").setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("duration")
      .setDescription("The duration of the mute (10s 10m 1h)")
      .setRequired(true)
  )
  .setDMPermission(false);

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
  botPermissions: ["Administrator"],
  userPermissions: ["MuteMembers", "MoveMembers", "ManageMessages"],
};

const db = new Database();

export async function run({ interaction, client, handler }: SlashCommandProps) {
  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason", true);
  const durationString = interaction.options.getString("duration", true);
  const infiniteDuration = durationString.includes("inf");

  const interactionMember = interaction.member as GuildMember;
  const memberPerms = interactionMember.permissions;

  const muteRole = (await db.findOne(
    MuteRoleSchema,
    { guildID: interaction.guildId },
    true
  )) as MuteRoleType | null;

  if (!muteRole) {
    return interaction.reply({
      content: "No mute role found in this server, please ask an Administrator to add one.",
    });
  }

  const time = SecondsFromTime(durationString, 60 * 60 * 24 * 7); // 1 week

  if (!time.success && !durationString.includes("inf")) {
    return interaction.reply({ content: "Failed to parse: " + durationString });
  }

  const getter = new ThingGetter(client);

  if (time.overLimit || infiniteDuration) {
    if (!memberPerms.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "Your permissions do not allow you to mute a user for longer than one week",
      });
    }
  }

  if (infiniteDuration) {
    time.seconds = 60 * 60 * 24 * 7 * 52 * 99; // 99 years
  }

  await interaction.reply({
    content: `Processing mute for ${userMention(user.id)}... ${waitingEmoji}`,
    allowedMentions: {},
  });

  const guild = interaction.guild!;
  const member = await getter.getMember(guild, user.id);

  if (!member) {
    return interaction.editReply({ content: "Failed to get the member to mute." });
  }

  const alreadyMuted =
    (await db.findOne(MutedUserSchema, {
      userId: user.id,
      guildID: guild.id,
      currentlyMuted: true,
    })) !== null;

  if (alreadyMuted) {
    return interaction.editReply({
      content: `${userMention(
        user.id
      )} is already muted. Use \`/unmute\` to unmute them. Then try again.`,
      allowedMentions: {},
    });
  }

  const previousRoles = member.roles.cache.map((role) => role.id);
  debugMsg(`Previous roles: ${previousRoles.join(", ")}`);

  // Remove all roles on the user, then add the mute role
  try {
    await member.roles.set([]);
    await member.roles.add(muteRole.roleID);
    console.log(member.roles.valueOf());
  } catch (error) {
    console.error(error);
    return interaction.editReply({
      // @ts-ignore
      content: `Failed to mute ${userMention(user.id)}: ${error.message}`,
      allowedMentions: {},
    });
  }

  const now = new Date();
  const caseID = randomUUID();
  const muteData = {
    userId: user.id,
    guildID: guild.id,
    previousRoles,
    mutedUntil: new Date(now.getTime() + time.seconds * 1000),
    mutedAt: now,
    mutedIndefinitely: infiniteDuration,
    reason,
    moderator: interaction.user.id,
    caseID,
    currentlyMuted: true,
  };

  await db.findOneAndUpdate(
    MutedUserSchema,
    { userId: user.id, guildID: guild.id, caseID },
    muteData
  );

  waitToUnmute(muteData, db, client, getter);

  log(`Muted ${user.tag} in ${guild.name} for ${time.seconds} seconds`);

  return interaction.editReply({
    content: ``,
    embeds: [
      BasicEmbed(
        client,
        `Mute case ${caseID}`,
        `${userMention(
          user.id
        )} was muted.\n\n**Reason:** ${reason}\n**Duration:** ${durationString}\nMuted by: ${userMention(
          interaction.user.id
        )}`
      ),
    ],
    allowedMentions: {},
  });
}
