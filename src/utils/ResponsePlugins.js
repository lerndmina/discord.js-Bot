const { MessageMentions } = require("discord.js");
const log = require("fancy-log");
const env = require("./FetchEnvs")();

const Tenor = require("tenorjs").client({
  Key: env.TENOR_API_KEY, // https://developers.google.com/tenor/guides/quickstart
  Filter: "off", // "off", "low", "medium", "high", not case sensitive
  Locale: "en_US", // Your locale here, case-sensitivity depends on input
  MediaFilter: "minimal", // either minimal or basic, not case sensitive
  DateFormat: "D/MM/YYYY - H:mm:ss A", // Change this accordingly
});

module.exports = async (response) => {
  // if response contains a gif, send the gif
  if (response.includes("gif_search")) {
    var gifUrl = "";
    const query = response.split("gif_search(")[1].split(")")[0];
    await Tenor.Search.Query(query, "1").then((gifResults) => {
      gifUrl = gifResults[0].url;
    });

    // Replace the gif_search() with the gif url encoded in markdown with the query as the alt text
    response = response.replace(`gif_search(${query})`, `[${query.replace(/"/g, "")}](${gifUrl})`);
  }

  // Remove all mentions from the response
  response = response.replace(MessageMentions.UsersPattern, "\\@REMOVED");
  response = response.replace(MessageMentions.EveryonePattern, "\\@REMOVED");
  response = response.replace(MessageMentions.RolesPattern, "\\@REMOVED");

  return response;
};
