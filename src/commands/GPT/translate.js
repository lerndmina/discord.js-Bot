const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const BasicEmbed = require("../../utils/BasicEmbed");
const log = require("fancy-log");

require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;
const PREFIX = process.env.PREFIX;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("Translate Message")
    .setType(ApplicationCommandType.Message),
  options: {
    devOnly: true,
    guildOnly: true,
  },
  run: async ({ interaction, client, handler }) => {
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

    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);

    const filter = (interaction) => interaction.customId === modalId;

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

        const aiResponse = response.data.choices[0].text.trim().replace(/\n/g, " ");

        const embed = BasicEmbed(
          interaction.client,
          "Translated Message",
          `Translated to ${languageValue}:\n\n${aiResponse}`
        );

        // Send the response back to discord
        modalInteraction.editReply({ embeds: [embed], ephemeral: true });
      })
      .catch((err) => {
        log(err);
      });
  },
};
