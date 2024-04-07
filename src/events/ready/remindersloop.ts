import { ActivityType, type ActivityOptions, type Client, PresenceStatusData } from "discord.js";
import type { CommandKit } from "commandkit";
import log from "fancy-log";
import { redisClient } from "../../Bot";
import Database from "../../utils/data/database";
import Settings, { SettingsType } from "../../models/Settings";
import { ActivityEnum } from "../../commands/utilities/settings";
import Reminders, { RemindersType } from "../../models/Reminders";
import { debugMsg, ThingGetter } from "../../utils/TinyUtils";
import FetchEnvs from "../../utils/FetchEnvs";
import BasicEmbed from "../../utils/BasicEmbed";
const env = FetchEnvs();

const ONE_HOUR_MS = 60 * 60 * 1000;

export default async (c: Client<true>, client: Client<true>, handler: CommandKit) => {
  const getter = new ThingGetter(client);

  await processReminders(client, getter);
  setInterval(() => {
    processReminders(client, getter);
  }, ONE_HOUR_MS);
};

async function processReminders(client: Client<true>, getter: ThingGetter) {
  const now = Date.now();
  const hourFromNow = now + ONE_HOUR_MS;

  const db = new Database();
  await db.cleanCache(`${env.MONGODB_DATABASE}:Reminders:*`);
  // prettier-ignore
  const reminders = (await db.find(Reminders, { botId: client.user?.id }, false)) as RemindersType[];
  if (!reminders) return log.info("No reminders found.");
  if (reminders && reminders.length) {
    log.info(`Found ${reminders.length} reminders.`);
    for (const reminder of reminders) {
      const reminderTime = reminder.reminderDate.getTime();
      if (hourFromNow >= reminderTime) {
        remindUserInTime(reminder, client, now, getter, db);
      }
    }
  }
}

export async function remindUserInTime(
  reminder: RemindersType,
  client: Client<true>,
  now: number,
  getter: ThingGetter,
  db: Database
) {
  const user = await getter.getUser(reminder.userId);
  if (!user) return deleteReminder(reminder, db);

  const dmChannel = await user.createDM();
  if (!dmChannel) return deleteReminder(reminder, db);

  const remindInMs = reminder.reminderDate.getTime() - now;

  const reminderEmbed = BasicEmbed(client, "Reminder", reminder.reminderText);

  // wait to send the reminder
  setTimeout(async () => {
    try {
      await dmChannel.send({ embeds: [reminderEmbed] });
    } catch (e) {
      debugMsg(`Failed to send reminder to ${user.username}.`);
    }
    deleteReminder(reminder, db);
  }, remindInMs);
}

async function deleteReminder(reminder: RemindersType, db: Database) {
  await db.deleteOne(Reminders, { reminderId: reminder.reminderId });
}
