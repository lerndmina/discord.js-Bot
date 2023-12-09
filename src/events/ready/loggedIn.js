const { Client, PresenceStatus, ActivityType } = require("discord.js");
var log = require("fancy-log");
const { Database } = require("../../utils/cache/database");
const Modmail = require("../../models/Modmail");
const { ThingGetter } = require("../../utils/TinyUtils");

/**
 *
 * @param {Client} c
 * @param {Client} client
 */
module.exports = (c, client) => {
  const db = new Database();
  log(`Logged in as ${client.user.tag}`);

  // Set online
  client.user.setActivity("for messages.", { type: ActivityType.Watching });
  client.user.setStatus("online");

  // db.findOne(Modmail, { userId: "218661243165212672" });
  // const getter = new ThingGetter(client);
  // getter.get("234439833802637312", "user").then((user) => {
  //   user.send("Hello");
  // });
};
