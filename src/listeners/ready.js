const { Client } = require("discord.js");

module.exports = (client) => {
  client.on("ready", async () => {
    if (!client.user || !client.application) {
      return;
    }

    console.log(`Logged in as ${client.user.username}!`);
  });
};
