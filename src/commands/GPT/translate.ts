import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
} from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import BasicEmbed from "../../utils/BasicEmbed";
import log from "fancy-log";
import FetchEnvs from "../../utils/FetchEnvs";
import { CommandOptions, MessageContextMenuCommandProps } from "commandkit";
const env = FetchEnvs();

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const data = new ContextMenuCommandBuilder()
  .setName("Translate Message")
  .setType(ApplicationCommandType.Message)
  .setDMPermission(false);

export const options: CommandOptions = {
  devOnly: true,
};

export async function run({ interaction, client, handler }: MessageContextMenuCommandProps) {
  const timestamp = interaction.createdTimestamp;
  const modalId = `translate-${interaction.user.id}-${timestamp}`;

  const modal = new ModalBuilder().setCustomId(modalId).setTitle("Translate a message");

  const languageInput = new TextInputBuilder()
    .setCustomId("languageInput")
    .setLabel("Enter the language to translate to")
    .setMinLength(1)
    .setMaxLength(100)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("English");

  const firstActionRow = new ActionRowBuilder().addComponents(languageInput);

  modal.addComponents(firstActionRow as any);

  await interaction.showModal(modal);

  const filter = (interaction: ModalSubmitInteraction) => interaction.customId === modalId;

  interaction
    .awaitModalSubmit({ filter, time: 120000 })
    .then(async (modalInteraction) => {
      const languageValue = modalInteraction.fields.getTextInputValue("languageInput");

      const content = interaction.targetMessage.content;

      // Get the number of tokens in the message
      const tokens = content.split(" ").length;

      // Check if the message is too long
      const TOKEN_LIMIT = 60;
      if (tokens > TOKEN_LIMIT) {
        await modalInteraction.reply({
          content: `Hey, this system is limited to ${TOKEN_LIMIT} words or less.`,
          ephemeral: true,
        });
        return;
      }

      // Tell discord to wait while we process the request
      await modalInteraction.deferReply({ ephemeral: true });

      // Send the message to OpenAI to be processed
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Translate this into ${languageValue}:\n\n${content}?\n\n1.`,
        temperature: 0,
        max_tokens: 60,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      const aiResponse = response.data.choices[0].text!.trim().replace(/\n/g, " ");

      const embed = BasicEmbed(
        interaction.client,
        "Translated Message",
        `Translated to ${languageValue}:\n\n${aiResponse}`
      );

      // Send the response back to discord
      modalInteraction.editReply({ embeds: [embed] });
    })
    .catch((err) => {
      log(err);
    });
}
