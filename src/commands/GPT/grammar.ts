import { ContextMenuCommandBuilder, ApplicationCommandType } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import BasicEmbed from "../../utils/BasicEmbed";
import FetchEnvs from "../../utils/FetchEnvs";
import { MessageContextMenuCommandProps } from "commandkit";
const env = FetchEnvs();

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const data = new ContextMenuCommandBuilder()
  .setName("Correct Grammar")
  .setType(ApplicationCommandType.Message)
  .setDMPermission(true);

export const options = {
  devOnly: true,
};

export async function run({ interaction, client, handler }: MessageContextMenuCommandProps) {
  const content = interaction.targetMessage.content;

  // Estimate the number of tokens in the message
  const tokens = content.split(" ").length;

  // Check if the message is too long
  const TOKEN_LIMIT = 60;
  if (tokens > TOKEN_LIMIT) {
    await interaction.reply({
      content: `Hey, this system is limited to ${TOKEN_LIMIT} words or less.`,
      ephemeral: true,
    });
    return;
  }

  // Tell discord to wait while we process the request
  await interaction.deferReply({ ephemeral: true });

  // Send the message to OpenAI to be processed
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Correct this to standard English:\n${content}`,
    temperature: 0,
    max_tokens: 60,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  });

  const aiResponse = response.data.choices[0].text!.trim().replace(/\n/g, " ");

  const embed = BasicEmbed(
    interaction.client,
    "Grammar Correction",
    aiResponse,
    undefined,
    "#0099ff"
  );

  // Send the response back to discord
  interaction.editReply({ embeds: [embed] });
}
