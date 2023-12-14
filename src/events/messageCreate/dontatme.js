const { Message, Client, ChannelType } = require("discord.js");
var log = require("fancy-log");
const { Database } = require("../../utils/cache/database");
const { ThingGetter, debugMsg } = require("../../utils/TinyUtils");
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
  if (message.channel.type === ChannelType.DM) return;
  if (message.mentions.users.has(message.author.id) && message.mentions.users.size === 1) return;

  const db = new Database();
  const guildId = message.guild.id;
  const fetchedRole = await db.findOne(DontAtMeRole, { guildId: guildId }, true);
  if (!fetchedRole) return;

  const roleId = fetchedRole.roleId;
  const getter = new ThingGetter(client);
  debugMsg(`Getting guild ${guildId}`);
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
      if (env.OWNER_IDS.includes(message.author.id)) {
        message.react("<:pepewtf:1183908617871700078>");
        return;
      }
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
