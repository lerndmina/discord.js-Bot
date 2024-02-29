import { ChannelType, Client, Message } from "discord.js";
import log from "fancy-log";
import ParseTimeFromMessage from "../../utils/ParseTimeFromMessage";
import BasicEmbed from "../../utils/BasicEmbed";
import { sleep } from "../../utils/TinyUtils";

export default async function (message: Message, client: Client<true>) {
  if (message.author.bot) return;
  if (message.channel.type == ChannelType.DM) return;

  const regex = /(?<!<)\b\d+(am|pm)?\b(?!>)/i;

  log.info("Processing message for time. . .");

  const data = ParseTimeFromMessage(message);

  if (!data.success) {
    return false;
  }

  log("We found a time! Parsed time: " + data.date);

  const embed = BasicEmbed(
    client,
    "Found Time!",
    // prettier-ignore
    `This looks like a time! I've parsed it as: <t:${data.seconds}:F> \nIf you want to send timestamps yourself, you can!\n Just use \`/getTime\` and I'll return you a discord timestamp from your message. \n\nI'll remove the embed in 60s and leave the timestamp.\n\nHere's some more details about this, in case something is wrong. . .\n\`\`\`json\n${JSON.stringify(data, null ,2)}\`\`\``
  );

  const content = `⏰ <t:${data.seconds}:F>`;

  const reply = await message.reply({ content, embeds: [embed] });

  sleep(60 * 1000).then(() => {
    try {
      reply.edit({ content, embeds: [] });
    } catch (error) {
      // We don't care if this fails, it's just a cleanup.
    }
  });

  return false;
}
