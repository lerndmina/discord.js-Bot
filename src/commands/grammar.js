const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const BasicEmbed = require("../utils/BasicEmbed");

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
    .setName("Correct Grammar")
    .setType(ApplicationCommandType.Message),
  options: {
    devOnly: true,
  },

  run: async ({ interaction, client, handler }) => {
    const content = interaction.targetMessage.content;

    // Get the number of tokens in the message
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

    const aiResponse = response.data.choices[0].text.trim().replace(/\n/g, " ");

    const embed = BasicEmbed(interaction.client, "Grammar Correction", aiResponse, "#0099ff");

    // Send the response back to discord
    interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
