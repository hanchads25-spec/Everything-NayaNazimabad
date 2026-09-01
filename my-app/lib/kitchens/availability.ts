import type { ScheduleType } from "@prisma/client";

/**
 * Hybrid availability engine for Food & Home Kitchens.
 *
 * A MenuItem is only orderable when ALL of the following hold:
 *  1. `isManualActive` is true (the vendor's one-tap on/off switch — always
 *     respected, even if the schedule below would otherwise allow it).
 *  2. `stockQty` is either untracked (null) or still > 0 (auto-hides once
 *     stock reaches 0, without touching `isManualActive` so it comes back
 *     automatically once restocked).
 *  3. The schedule allows it right now:
 *     - PERMANENT: always.
 *     - RECURRING_WEEKLY: today is in `activeDays` (or no days set = every
 *       day) AND, if a time window is set, we're inside it — including
 *       windows that cross midnight (e.g. "22:00" - "04:00" for a midnight
 *       deal).
 *     - SPECIFIC_DATE: `specificDate` is today AND, if set, inside the time
 *       window.
 *
 * All "now" comparisons use Pakistan Standard Time (UTC+5, no DST) since
 * that's the only timezone this society app serves — we don't want a
 * midnight-deal item flipping on/off according to the server's local clock.
 */

export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

const PKT_OFFSET_MINUTES = 5 * 60; // UTC+5

export interface PakistanNow {
  weekday: Weekday;
  minutesSinceMidnight: number; // 0-1439
  isoDate: string; // YYYY-MM-DD in PKT
}

export function getPakistanNow(reference: Date = new Date()): PakistanNow {
  const shifted = new Date(reference.getTime() + PKT_OFFSET_MINUTES * 60_000);
  // getUTCDay(): Sun=0..Sat=6 -> rotate so Mon=0..Sun=6 to match WEEKDAYS.
  const weekday = WEEKDAYS[(shifted.getUTCDay() + 6) % 7];
  const minutesSinceMidnight = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const isoDate = shifted.toISOString().slice(0, 10);
  return { weekday, minutesSinceMidnight, isoDate };
}

function toIsoDate(value: Date | string): string {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Handles windows that wrap past midnight, e.g. start=22:00 end=04:00. */
export function isWithinTimeWindow(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  minutesSinceMidnight: number
): boolean {
  if (!startTime || !endTime) return true;
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null || start === end) return true;

  if (start < end) {
    return minutesSinceMidnight >= start && minutesSinceMidnight < end;
  }
  return minutesSinceMidnight >= start || minutesSinceMidnight < end;
}

export interface AvailabilityInput {
  isManualActive: boolean;
  scheduleType: ScheduleType;
  activeDays: string[];
  specificDate: Date | string | null;
  startTime: string | null;
  endTime: string | null;
  stockQty: number | null;
}

export function isMenuItemActive(item: AvailabilityInput, now: PakistanNow = getPakistanNow()): boolean {
  if (!item.isManualActive) return false;
  if (item.stockQty !== null && item.stockQty !== undefined && item.stockQty <= 0) return false;

  if (item.scheduleType === "RECURRING_WEEKLY") {
    if (item.activeDays.length > 0 && !item.activeDays.includes(now.weekday)) return false;
    return isWithinTimeWindow(item.startTime, item.endTime, now.minutesSinceMidnight);
  }

  if (item.scheduleType === "SPECIFIC_DATE") {
    if (!item.specificDate || toIsoDate(item.specificDate) !== now.isoDate) return false;
    return isWithinTimeWindow(item.startTime, item.endTime, now.minutesSinceMidnight);
  }

  return true; // PERMANENT
}

export function formatTimeLabel(time: string | null | undefined): string | null {
  if (!time) return null;
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return time;
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
}

/** Seconds until this item's active status next flips, if determinable "today". Null = no countdown to show. */
export function getSecondsUntilTransition(
  item: AvailabilityInput,
  now: PakistanNow = getPakistanNow()
): number | null {
  if (item.scheduleType === "PERMANENT") return null;
  if (!item.startTime || !item.endTime) return null;

  const start = parseTimeToMinutes(item.startTime);
  const end = parseTimeToMinutes(item.endTime);
  if (start === null || end === null || start === end) return null;

  if (item.scheduleType === "RECURRING_WEEKLY") {
    if (item.activeDays.length > 0 && !item.activeDays.includes(now.weekday)) return null;
  } else if (item.scheduleType === "SPECIFIC_DATE") {
    if (!item.specificDate || toIsoDate(item.specificDate) !== now.isoDate) return null;
  }

  const activeNow = isMenuItemActive(item, now);
  const target = activeNow ? end : start;
  let diffMinutes = target - now.minutesSinceMidnight;
  if (diffMinutes <= 0) diffMinutes += 24 * 60;
  return diffMinutes * 60;
}

export function formatCountdown(seconds: number): string {
  const totalMinutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatDayList(days: string[]): string {
  if (days.length === 0) return "Every day";
  if (days.length === 7) return "Every day";
  return days
    .map((day) => WEEKDAY_LABELS[day as Weekday] ?? day)
    .join(", ");
}

export interface ScheduleDescription {
  /** Short label describing when this item is available, e.g. "Tue, Wed · 12:00 AM - 4:00 AM". */
  scheduleLabel: string | null;
  /** "Available now" / "Sold out" / "Starts in 2h 15m" / "Ends in 45m" etc. */
  statusLabel: string;
  countdownSeconds: number | null;
}

export function describeAvailability(
  item: AvailabilityInput,
  now: PakistanNow = getPakistanNow()
): ScheduleDescription {
  const isActive = isMenuItemActive(item, now);
  const countdownSeconds = getSecondsUntilTransition(item, now);

  let scheduleLabel: string | null = null;
  const timeWindow =
    item.startTime && item.endTime
      ? `${formatTimeLabel(item.startTime)} - ${formatTimeLabel(item.endTime)}`
      : null;

  if (item.scheduleType === "RECURRING_WEEKLY") {
    scheduleLabel = [formatDayList(item.activeDays), timeWindow].filter(Boolean).join(" · ");
  } else if (item.scheduleType === "SPECIFIC_DATE" && item.specificDate) {
    const dateLabel = new Date(toIsoDate(item.specificDate)).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
    });
    scheduleLabel = [dateLabel, timeWindow].filter(Boolean).join(" · ");
  }

  let statusLabel: string;
  if (!item.isManualActive) {
    statusLabel = "Turned off";
  } else if (item.stockQty !== null && item.stockQty !== undefined && item.stockQty <= 0) {
    statusLabel = "Sold out";
  } else if (isActive) {
    statusLabel = countdownSeconds !== null ? `Ends in ${formatCountdown(countdownSeconds)}` : "Available now";
  } else {
    statusLabel = countdownSeconds !== null ? `Starts in ${formatCountdown(countdownSeconds)}` : "Not available now";
  }

  return { scheduleLabel, statusLabel, countdownSeconds };
}
