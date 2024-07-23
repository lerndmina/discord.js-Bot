import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import log from "fancy-log";
import { globalCooldownKey, setCommandCooldown, waitingEmoji } from "../../Bot";
import { ThingGetter } from "../../utils/TinyUtils";
import Database from "../../utils/data/database";
import MuteRoleSchema, { MuteRoleType } from "../../models/MuteRoleSchema";
import MutedUserSchema from "../../models/MutedUserSchema";
import { unmuteUser } from "../../events/ready/checkmutes";

export const data = new SlashCommandBuilder()
  .setName("unmute")
  .setDescription("Unmute a user.")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to unmute.").setRequired(true)
  )
  .setDMPermission(false);

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
  userPermissions: ["Administrator"],
};

export async function run({ interaction, client, handler }: SlashCommandProps) {
  const user = interaction.options.getUser("user", true);
  const getter = new ThingGetter(client);
  const member = await getter.getMember(interaction.guild!, user.id);

  if (!member) {
    return interaction.reply({ content: "User not found in this server.", ephemeral: true });
  }

  await setCommandCooldown(globalCooldownKey(interaction.commandName), 10);
  const db = new Database();

  const mutedRoleData = (await db.findOne(MuteRoleSchema, {
    guildID: interaction.guildId,
  })) as MuteRoleType | null;

  if (!mutedRoleData) {
    return interaction.reply({
      content: "No mute role found for this server.",
      ephemeral: true,
    });
  }

  const mutedRole = await getter.getRole(interaction.guild!, mutedRoleData.roleID);

  if (!mutedRole) {
    return interaction.reply({
      content:
        "Mute role not found in this server but found in the database (ID: " +
        mutedRoleData.roleID +
        ").",
      ephemeral: true,
    });
  }

  const muteData = await db.findOne(MutedUserSchema, {
    guildID: interaction.guildId,
    userId: user.id,
    currentlyMuted: true,
  });

  const userHasMutedRole = member.roles.cache.has(mutedRole.id);

  if (!muteData && !userHasMutedRole) {
    return interaction.reply({
      content: "User is not currently muted.",
      ephemeral: true,
    });
  } else if (!muteData && userHasMutedRole) {
    await interaction.reply({
      content:
        "User has the mute role but no mute data found. It's possible the user was manually muted. I will attempt to remove the role.",
      ephemeral: true,
    });

    try {
      await member.roles.remove(mutedRole);

      return;
    } catch (error) {
      return interaction.editReply({
        content:
          "Failed to remove the mute role from the user, you will need to manually remove it.",
      });
    }
  } else {
    unmuteUser(muteData, db, client, getter);

    return interaction.reply({
      content: "User has been unmuted.",
      ephemeral: true,
    });
  }
}
