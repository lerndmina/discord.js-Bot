const { SlashCommandBuilder, Client } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const BasicEmbed = require("../utils/BasicEmbed");
var log = require("fancy-log");

require("dotenv").config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const systemPrompt = require("../utils/SystemPrompt");
const ResponsePlugins = require("../utils/ResponsePlugins");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the AI without previous chat messages.")
    .addStringOption((option) =>
      option.setName("message").setDescription("The message to send to the AI.").setRequired(true)
    ),
  options: {
    devOnly: false,
  },
  run: async ({ interaction, client, handler }) => {
    const env = require("../utils/FetchEnvs")();
    const requestMessage = interaction.options.getString("message");

    const configuration = new Configuration({
      apiKey: env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    let conversation = [{ role: "system", content: systemPrompt }];

    conversation.push({
      role: "user",
      content: requestMessage,
      name: interaction.user.username.replace(/\s+/g, "_").replace(/[^\w\s]/gi, ""),
    });

    // Tell discord to wait while we process the request
    await interaction.deferReply({ ephemeral: false });

    // Send the message to OpenAI to be processed
    const response = await openai
      .createChatCompletion({
        model: "gpt-4",
        messages: conversation,
        // max_tokens: 256, // limit token usage
      })
      .catch((error) => {
        log.error(`OPENAI ERR: ${error}`);
      });

    const aiResponse = await ResponsePlugins(response.data.choices[0].message.content);

    // Send the response back to discord
    interaction.editReply({ content: aiResponse, ephemeral: false });
  },
};
