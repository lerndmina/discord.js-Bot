import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import log from "fancy-log";
import { globalCooldownKey, setCommandCooldown, waitingEmoji } from "../../Bot";
import mc from "minecraft-protocol";
import FetchEnvs from "../../utils/FetchEnvs";
import { flattenStringArray, stripMotdColor, uploadImgurFromBase64 } from "../../utils/TinyUtils";

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
  devOnly: false,
  deleted: false,
};

export async function run({ interaction, client, handler }: SlashCommandProps) {
  await interaction.reply({ content: waitingEmoji, ephemeral: false });
  setCommandCooldown(globalCooldownKey(interaction.commandName), 60);

  await mc.ping(server, async function (err, resp) {
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
      .setTitle(`🏓 ${server.host} Status`)
      .addFields(
        {
          name: "Ping",
          value: `\`${res.latency}ms\``,
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
      .setColor("Random");

    if (res.favicon) {
      const imgurResponse = await uploadImgurFromBase64(res.favicon);

      if (imgurResponse.success) {
        embed.setThumbnail(imgurResponse.data.link);
      } else {
        log.error("Error uploading imgur", imgurResponse);
      }
    }

    if (typeof res.description === "object" && "text" in res.description) {
      if (res.description.text) {
        embed.addFields({
          name: "Description",
          value: stripMotdColor(flattenStringArray(res.description.text)),
        });
      }
    }

    interaction.editReply({ embeds: [embed], content: "" });
  });
}
