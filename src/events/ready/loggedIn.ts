import { ActivityType, type ActivityOptions, type Client, PresenceStatusData } from 'discord.js';
import type { CommandKit } from 'commandkit';
import log from 'fancy-log';

/**
 *
 * @param {Client} c
 * @param {Client} client
 */
export default (c: Client<true>, client: Client<true>, handler: CommandKit) => {
  log(`Logged in as ${client.user?.tag}`);

  // Set online
  const activityOptions: ActivityOptions = {
    type: ActivityType.Watching,
    name: ''
  };
  client.user.setActivity("for messages.", activityOptions);
  client.user.setStatus("online" as PresenceStatusData);
};