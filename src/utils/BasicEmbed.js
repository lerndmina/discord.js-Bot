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

  if (!color.includes("#")) {
    // Uppercase first letter and lowercase the rest to comply with EmbedBuilder
    color = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
  }
  const avatarURL = client.user.avatarURL();

  var embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setAuthor({ name: client.user.username, iconURL: avatarURL, url: "https://lerndmina.dev" })
    .setTimestamp(Date.now());

  if (fields != undefined) {
    fields.forEach((field) => {
      embed.addFields(field);
    });
  }

  return embed;
};
