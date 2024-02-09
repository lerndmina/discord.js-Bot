import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import log from "fancy-log";
import { globalCooldownKey, setCommandCooldown, waitingEmoji } from "../../Bot";
import mc from "minecraft-protocol";
import FetchEnvs from "../../utils/FetchEnvs";

const env = FetchEnvs();

const server = {
  host: env.MC_SERVER_IP,
  port: env.MC_SERVER_PORT,
};

export const data = new SlashCommandBuilder()
  .setName("thalwyrn")
  .setDescription("This will ping our minecraft server and return the status of the server.")
  .setDMPermission(true);

export const options: CommandOptions = {
  devOnly: true,
  deleted: false,
};

export async function run({ interaction, client, handler }: SlashCommandProps) {
  await interaction.reply({ content: waitingEmoji, ephemeral: true });
  setCommandCooldown(globalCooldownKey(interaction.commandName), 60);

  await mc.ping(server, function (err, resp) {
    if (err) {
      log.error(err);
      interaction.editReply(`Error pinging \`${server.host}\`: ${err}`);
      return;
    }
    if (resp.version instanceof String) {
      interaction.editReply("We don't handle old style pings sorry.");
      return console.log("We don't handle old style pings sorry.");
    }
    const res = resp as mc.NewPingResult;
    const embed = new EmbedBuilder()
      .setTitle("🏓 Server Status")
      .addFields(
        {
          name: "Server",
          value: `\`${server.host}:${server.port}\``,
        },
        {
          name: "Version",
          value: res.version.name,
        },
        {
          name: "Players",
          value: `${res.players.online}/${res.players.max}`,
        }
      )
      .setColor("#0099ff");
    interaction.editReply({ embeds: [embed], content: "" });
  });
}
