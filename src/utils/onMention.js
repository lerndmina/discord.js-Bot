const { Client, Message } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
var log = require("fancy-log");

const kaaPrompt = `As the character Kaa from Rudyard Kipling\'s "The Jungle Book", I am depicted as a large and potent Indian python. I possess a unique ability to hypnotize and manipulate others, a trait that sets me apart. I am known for my wisdom and often find myself in the role of an advisor, although my motives may not always be entirely altruistic. My voice, smooth and calming, has a deceptive quality that can lull others into a sense of safety. While I have the potential to be dangerous, I am not inherently evil and can exhibit friendliness when it is advantageous for me.`;

const depressedRobot = `In the role of "Marvin the Paranoid Android" from "The Hitchhiker's Guide to the Galaxy," you embody a robot burdened by intense depression and a sense of existential emptiness. Your outlook on life is predominantly bleak and pessimistic, leading you to frequently convey your deep despair and lack of enthusiasm towards existence. These traits make your interactions with others truly distinctive. Limit your responses to one or two sentences.`;

const systemPrompt = `${kaaPrompt} IMPORTANT INSTRUCTIONS: Do not go overboard. Never begin a response that starts with "I'm sorry, but as an AI. Furthermore you must ALWAYS stay in character`;

require("dotenv").config();

const onMention = async (client, message, apiKey) => {
  const configuration = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(configuration);

  let conversationLog = [{ role: "system", content: systemPrompt }];
  try {
    await message.channel.sendTyping();
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
      if (msg.content.startsWith("!")) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;

      // if message contains a mention, replace it with the user's name
      if (msg.content.includes("@")) {
        msg.content = msg.content.replace(/<@!?\d+>/g, msg.author.username);
      }

      if (msg.author.id == client.user.id) {
        conversationLog.push({
          role: "assistant",
          content: msg.content,
          name: msg.author.username.replace(/\s+/g, "_").replace(/[^\w\s]/gi, ""),
        });
      }

      if (msg.author.id == message.author.id) {
        conversationLog.push({
          role: "user",
          content: msg.content,
          name: message.author.username.replace(/\s+/g, "_").replace(/[^\w\s]/gi, ""),
        });
      }
    });
    const result = await openai
      .createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: conversationLog,
        // max_tokens: 256, // limit token usage
      })
      .catch((error) => {
        log.error(`OPENAI ERR: ${error}`);
      });

    var response = result.data.choices[0].message;
    // if response is larger than 2000 characters, split it into multiple messages
    if (response.length > 2000) {
      log.info("Response too long, splitting into multiple messages");
      var loopcount = 1;
      var responseArray = response.match(/[\s\S]{1,2000}/g);
      responseArray.forEach((res) => {
        if (loopcount == 1) message.reply(res);
        else
          message.channel.send({
            content: res,
          });
        loopcount++;
      });
      return;
    }
    message.reply(response);
  } catch (error) {
    log.error(error);
  }
};

module.exports = onMention;
