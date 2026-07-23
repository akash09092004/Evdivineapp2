const mongoose = require("mongoose");

const isObjectId = (value) => mongoose.isValidObjectId(value);

const normalizeCurrency = (currency = "USD") =>
  String(currency || "USD").trim().toUpperCase();

const pad = (value) => String(value).padStart(2, "0");

const toTimeParts = (value) => {
  const [datePart, timePart] = String(value || "").split("T");
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, secondPart = "0"] = timePart.replace("Z", "").split(":");
  const second = Number(String(secondPart).split(".")[0] || 0);

  return {
    year,
    month,
    day,
    hour: Number(hour),
    minute: Number(minute),
    second,
  };
};

const startOfDayInTimeZone = (date, timeZone) => {
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) return null;

  const locale = base.toLocaleDateString("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = locale.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

const getZonedDateParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(date));
  const pick = (type) => Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  };
};

const zonedTimeToUtc = (dateString, timeString, timeZone) => {
  const [year, month, day] = String(dateString)
    .split("-")
    .map((value) => Number(value));
  const [hour = "0", minute = "0"] = String(timeString).split(":");

  const utcGuess = new Date(Date.UTC(year, month - 1, day, Number(hour), Number(minute), 0));
  const zoned = getZonedDateParts(utcGuess, timeZone);
  const offsetMinutes =
    (zoned.hour - Number(hour)) * 60 + (zoned.minute - Number(minute));

  return new Date(utcGuess.getTime() - offsetMinutes * 60 * 1000);
};

const utcToZonedDateString = (utcDate, timeZone) => {
  const parts = getZonedDateParts(utcDate, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

const utcToZonedTimeString = (utcDate, timeZone) => {
  const parts = getZonedDateParts(utcDate, timeZone);
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
};

const overlaps = (startA, endA, startB, endB) =>
  new Date(startA).getTime() < new Date(endB).getTime() &&
  new Date(endA).getTime() > new Date(startB).getTime();

const minutesToClock = (minutes) => {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(total / 60);
  const minute = total % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${pad(hour12)}:${pad(minute)} ${period}`;
};

const clockToMinutes = (clock) => {
  const [timePart, period] = String(clock || "").trim().split(/\s+/);
  if (!timePart || !period) return 0;
  const [hourRaw, minuteRaw] = timePart.split(":");
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw || 0);
  const normalizedPeriod = period.toUpperCase();
  if (normalizedPeriod === "PM" && hour !== 12) hour += 12;
  if (normalizedPeriod === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
};

const clock24ToMinutes = (clock) => {
  const [hourRaw = "0", minuteRaw = "0"] = String(clock || "0:0").split(":");
  return Number(hourRaw) * 60 + Number(minuteRaw);
};

const minutesToClock24 = (minutes) => {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${pad(hour)}:${pad(minute)}`;
};

const sanitizeText = (value, maxLength = 1000) =>
  String(value || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim()
    .slice(0, maxLength);

module.exports = {
  isObjectId,
  normalizeCurrency,
  startOfDayInTimeZone,
  zonedTimeToUtc,
  utcToZonedDateString,
  utcToZonedTimeString,
  overlaps,
  minutesToClock,
  clockToMinutes,
  clock24ToMinutes,
  minutesToClock24,
  sanitizeText,
};
