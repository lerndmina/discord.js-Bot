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
    .setName("whatis")
    .setDescription("Ask the AI about this object")
    .addStringOption((option) =>
      option
        .setName("object")
        .setDescription("The object for the AI to describe.")
        .setRequired(true)
        .setMaxLength(15)
    ),
  options: {
    devOnly: false,
    deleted: false,
  },
  run: async ({ interaction, client, handler }) => {
    const env = require("../utils/FetchEnvs")();
    const requestMessage = interaction.options.getString("object");

    const configuration = new Configuration({
      apiKey: env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    let conversation = [
      {
        role: "system",
        content:
          "You are an AI, you will be presented with a name or object. You must come up with a funny and incorrect description for the prompt. Please keep it short. You do not need to mention the object name in the response.",
      },
    ];

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

    const aiResponse = response.data.choices[0].message.content;

    // Send the response back to discord
    interaction.editReply({
      embeds: [BasicEmbed(client, `Object: ${requestMessage}`, `\`\`\`${aiResponse}\`\`\``)],
      ephemeral: false,
    });
  },
};
