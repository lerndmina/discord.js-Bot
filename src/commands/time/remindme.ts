import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import log from "fancy-log";
import { globalCooldownKey, setCommandCooldown, userCooldownKey, waitingEmoji } from "../../Bot";
import Database from "../../utils/data/database";
import ms from "ms";
import Reminders from "../../models/Reminders";
import { randomUUID } from "crypto";
import BasicEmbed from "../../utils/BasicEmbed";

export const data = new SlashCommandBuilder()
  .setName("remindme")
  .setDescription("Set a reminder for yourself.")
  .addStringOption((option) =>
    option.setName("reminder").setDescription("Reminder content").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("time").setDescription("Time to remind you at 1m | 1h | 1d").setRequired(true)
  )
  .setDMPermission(true);

export const options: CommandOptions = {
  devOnly: true,
  deleted: false,
};

export async function run({ interaction, client, handler }: SlashCommandProps) {
  await interaction.reply({ content: waitingEmoji, ephemeral: true });
  setCommandCooldown(userCooldownKey(interaction.user.id, interaction.commandName), 300);

  const reminder = interaction.options.getString("reminder", true);
  const timeString = interaction.options.getString("time", true);
  const reminderId = randomUUID();

  if (!reminder || !timeString) return interaction.editReply("Either reminder or time is missing.");

  const time = ms(timeString);
  if (!time) return interaction.editReply("Invalid time format.");

  const reminderDate = new Date(Date.now() + time);

  const db = new Database();

  await db.findOneAndUpdate(
    Reminders,
    { reminderId },
    {
      botId: client.user.id,
      userId: interaction.user.id,
      reminderId,
      reminderText: reminder,
      reminderDate,
    }
  );

  interaction.editReply({
    content: "",
    embeds: [
      BasicEmbed(
        client,
        "Reminder set",
        `I will remind you <t:${Math.floor(
          reminderDate.getTime() / 1000
        )}:R> with the message: \`${reminder}\``
      ),
    ],
  });
}
