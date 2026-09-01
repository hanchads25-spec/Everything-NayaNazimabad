export interface PrayerTiming {
  key: string;
  label: string;
  /** 24-hour "HH:mm" time */
  time: string;
}

/**
 * Placeholder timings for today. Replace with live data from a mosque
 * timings source/API once one is wired up.
 */
export const todayMosqueTimings: PrayerTiming[] = [
  { key: "fajr", label: "Fajr", time: "05:15" },
  { key: "zuhr", label: "Zuhr", time: "13:30" },
  { key: "asr", label: "Asr", time: "17:15" },
  { key: "maghrib", label: "Maghrib", time: "19:05" },
  { key: "isha", label: "Isha", time: "20:30" },
];

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Formats a "HH:mm" 24-hour time string as e.g. "5:15 AM". */
export function formatPrayerTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/** Returns the key of the next upcoming prayer (or the last one if the day is over). */
export function getNextPrayerKey(
  timings: PrayerTiming[] = todayMosqueTimings,
  now: Date = new Date()
): string {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = timings.find((timing) => timeToMinutes(timing.time) >= nowMinutes);
  return (upcoming ?? timings[timings.length - 1]).key;
}
