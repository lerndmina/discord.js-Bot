import ms from "ms";
import { debugMsg } from "./TinyUtils";

export default function SecondsFromTime(
  timeString: string,
  limitSeconds?: number
): { success: boolean; seconds: number; overLimit: boolean } {
  const timeStringArr = timeString!.split(" ");

  var time = 0;

  for (const timeStr of timeStringArr) {
    const tempTime = ms(timeStr);
    if (isNaN(tempTime)) {
      time += 0;
      debugMsg(`Found NaN in timeString: ${timeStr} - skipping`);
    } else {
      time += ms(timeStr);
      debugMsg(`Adding ${timeStr} to time. Total: ${time}`);
    }
  }

  time = Math.round(time / 1000);

  console.log(`TimeString: ${timeString} translated to ${time} seconds`);

  if (time <= 0) {
    return { success: false, seconds: time, overLimit: false };
  }

  if (limitSeconds && time > limitSeconds) {
    return { success: true, seconds: time, overLimit: true };
  }

  return { success: true, seconds: time, overLimit: false };
}
