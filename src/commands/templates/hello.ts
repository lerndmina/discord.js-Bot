import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit';
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import log from 'fancy-log';
import { waitingEmoji } from '../../Bot';


export const data = new SlashCommandBuilder().setName("hello").setDescription("This is a template command.");

export const options: CommandOptions = {
  devOnly: true,
  guildOnly: false,
  deleted: false,
};

export async function run({interaction, client, handler}: SlashCommandProps) {
  await interaction.reply({ content: waitingEmoji, ephemeral: true});
  interaction.editReply({ content: "Loading spinner complete" });
};
