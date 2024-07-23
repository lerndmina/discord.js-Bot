import { ChannelType, Message, type Client } from "discord.js";
import type { CommandKit } from "commandkit";
import PollsSchema, { PollsType } from "../../models/PollsSchema";
import Database from "../../utils/data/database";
import { ThingGetter, debugMsg, sleep } from "../../utils/TinyUtils";
import { log } from "itsasht-logger";
import { endPoll } from "../interactionCreate/poll-interaction";
import MutedUserSchema, { MutedUserType } from "../../models/MutedUserSchema";
import FetchEnvs from "../../utils/FetchEnvs";

const env = FetchEnvs();
/**
 *
 * @param {Client} c
 * @param {Client} client
 */
export default async (c: Client<true>, client: Client<true>, handler: CommandKit) => {
  await sleep(500);

  const db = new Database();
  db.cleanCache(env.MONGODB_DATABASE + ":MutedUser:*");
  const getter = new ThingGetter(client);
  const mutes = await MutedUserSchema.find({ currentlyMuted: true, mutedIndefinitely: false });
  if (!mutes) return log.info("No active mutes found in the database.");

  for (const mute of mutes) {
    const guild = await getter.getGuild(mute.guildID);
    if (!guild) return log.error("Guild not found for mute: " + mute.guildID);
    const member = await getter.getMember(guild, mute.userId);
    if (!member) return log.error("Member not found for mute: " + mute.userId);

    if (new Date(mute.mutedUntil).getTime() < Date.now()) {
      await unmuteUser(mute, db, client, getter);
    } else {
      waitToUnmute(mute, db, client, getter);
    }
  }
};

export async function waitToUnmute(
  mute: any,
  db: Database,
  client: Client<true>,
  getter: ThingGetter
) {
  const timeUntilUnmute = new Date(mute.mutedUntil).getTime() - Date.now();
  log.info(`Starting timeout for unmute: "${mute.userId}" -> "guildId:${mute.guildID}"`);
  setTimeout(async () => {
    await unmuteUser(mute, db, client, getter);
  }, timeUntilUnmute);
}

export async function unmuteUser(
  mute: any,
  db: Database,
  client: Client<true>,
  getter: ThingGetter
) {
  const guild = await getter.getGuild(mute.guildID);
  if (!guild) return log.error("Guild not found for mute: " + mute.guildID);
  const member = await getter.getMember(guild, mute.userId);
  if (!member) return log.error("Member not found for mute: " + mute.userId);
  log.info("Unmuting user: " + member.user.tag);
  const roles = mute.previousRoles;
  try {
    await member.roles.set(roles);
  } catch (error) {
    log.error("Failed to unmute user: " + member.user.tag + " with error: " + error);
    return;
  }
  mute.currentlyMuted = false;
  await db.findOneAndUpdate(
    MutedUserSchema,
    { userId: mute.userId, guildID: mute.guildID, caseID: mute.caseID },
    mute
  );
  db.cleanCache(env.MONGODB_DATABASE + ":MutedUser:*");
}
