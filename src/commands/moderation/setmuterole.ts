import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import { SlashCommandBuilder, EmbedBuilder, roleMention } from "discord.js";
import log from "fancy-log";
import { globalCooldownKey, setCommandCooldown, waitingEmoji } from "../../Bot";
import Database from "../../utils/data/database";
import MuteRoleSchema from "../../models/MuteRoleSchema";

export const data = new SlashCommandBuilder()
  .setName("setmuterole")
  .setDescription("Set the mute role for this server")
  .addRoleOption((option) =>
    option.setName("role").setDescription("The role to set as the mute role").setRequired(false)
  )
  .addBooleanOption((option) =>
    option.setName("remove").setDescription("Remove the mute role").setRequired(false)
  )
  .setDMPermission(false);

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
  userPermissions: ["Administrator"],
};

export async function run({ interaction, client, handler }: SlashCommandProps) {
  const role = interaction.options.getRole("role");
  const remove = interaction.options.getBoolean("remove");

  if (!role && !remove) {
    return interaction.reply({
      content: "Please provide a role or set remove to true",
      ephemeral: true,
    });
  }

  if (role && remove) {
    return interaction.reply({
      content: "Please provide only a role or set remove to true, not both",
      ephemeral: true,
    });
  }

  await setCommandCooldown(globalCooldownKey(interaction.commandName), 30);

  const db = new Database();

  await interaction.reply({ content: waitingEmoji, ephemeral: true });

  if (role) {
    db.findOneAndUpdate(MuteRoleSchema, { guildID: interaction.guildId }, { roleID: role.id });
    interaction.editReply({ content: `Role ${roleMention(role.id)} added as the muted role.` });
    return;
  }

  if (remove) {
    // This if statement is redundant but it's here for clarity
    db.findOneAndDelete(MuteRoleSchema, { guildID: interaction.guildId });
    interaction.editReply({
      content:
        "Role removed from the database. \n\n# WARNING this will prevent already muted people from being unmuted when the time expires!!!!",
    });
    return;
  }
}
