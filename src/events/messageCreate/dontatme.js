const { Message, Client } = require("discord.js");
var log = require("fancy-log");
const { Database } = require("../../utils/cache/database");
const { ThingGetter } = require("../../utils/TinyUtils");
const RoleButtons = require("../../models/RoleButtons");
const DontAtMeRole = require("../../models/DontAtMeRole");
const BasicEmbed = require("../../utils/BasicEmbed");

const env = require("../../utils/FetchEnvs")();

/**
 *
 * @param {Message} message
 * @param {Client} client
 * @returns
 */
module.exports = async (message, client) => {
  if (message.author.bot) return;
  if (!message.mentions.users) return;
  if (message.channel.type === "DM") return;

  const db = new Database();
  const guildId = message.guild.id;
  const fetchedRole = await db.findOne(DontAtMeRole, { guildId: guildId }, true);
  if (!fetchedRole) return;

  const roleId = fetchedRole.roleId;
  const getter = new ThingGetter(client);
  const guild = await getter.getGuild(guildId);
  const role = guild.roles.cache.get(roleId);

  if (!role) {
    log("Don't @ Me Role is setup but not found " + roleId);
    return;
  }
  var hasRole = false;
  message.mentions.users.forEach((user) => {
    const member = guild.members.cache.get(user.id);
    if (!member) return;
    if (member.roles.cache.has(roleId)) {
      hasRole = true;
    }
  });
  if (!hasRole) return;
  message.reply({
    embeds: [
      BasicEmbed(client, "Hey!", `Please don't mention users who have the <@&${roleId}> role!`),
    ],
  });
  return true;
};
