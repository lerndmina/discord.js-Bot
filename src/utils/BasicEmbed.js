// use the embed builder from discord.js to return an embed

const { Client, EmbedBuilder, Embed } = require("discord.js");

/**
 *
 * @param {Client} client
 * @param {string} title
 * @param {string} description
 * @param {[{name: string, value: string, inline: boolean}]} fields
 * @param {string} color
 * @returns
 */

module.exports = (client, title, description, fields, color) => {
  if (color == undefined) color = "Random";
  // if fields is a string,
  // then it's the color
  if (typeof fields === "string") {
    color = fields;
    fields = [];
  }

  if (description == "*") description = "‎";

  if (!color.includes("#")) {
    // Uppercase first letter and lowercase the rest to comply with EmbedBuilder
    color = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
  }

  const botMessages = [
    "🤖 Humor capacity overload. Please stand by...",
    "🤖 Don't mind me. Just your friendly neighbourhood bot.",
    "🤖 Turning caffeine into code.",
    "⚡ Powered by logic, love and a dash of lunacy.",
    "🤖 Bot code cracking humor from dark.",
    "💾 Loading punchline... error. Ah, who cares?",
    "🤖 Bot mode: Beep Boop Boop Bleep. Translation: Have a nice day!",
    "💻 Created for chuckles, not for chores.",
    "🤖 Don't fear my humor... It's all in the programming!",
    "🤖 Beep. Boop. Bot. Chuckles",
    "🤖 Beep Boop! Another pointless task completed.",
    "🤖 This task, like everything else, shall pass...",
  ];

  var embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.avatarURL(),
      url: "https://lerndmina.dev",
    })
    .setTimestamp(Date.now())
    .setFooter({ text: ` ` });

  if (fields != undefined) {
    fields.forEach((field) => {
      embed.addFields(field);
    });
  }

  return embed;
};
