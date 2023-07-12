// use the embed builder from discord.js to return an embed

const { EmbedBuilder } = require("discord.js");

module.exports = (client, title, description, fields, color) => {
  if (color == undefined) color = "Random";
  // if fields is a string,
  // then it's the color
  if (typeof fields === "string") {
    color = fields;
    fields = [];
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
