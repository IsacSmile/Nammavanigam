import { validatePhone, digitsOf } from "./contact";

export interface AppointmentRawInput {
  name?: unknown;
  phone?: unknown;
  date?: unknown;
  time?: unknown;
  message?: unknown;
  company?: unknown;
}

export interface AppointmentCleanedValues {
  name: string;
  phone: string;
  date: string;
  time: string;
  message: string | null;
}

export type AppointmentFieldErrors = {
  name?: string;
  phone?: string;
  date?: string;
  time?: string;
  message?: string;
};

export interface AppointmentValidationResult {
  isValid: boolean;
  errors: AppointmentFieldErrors;
  values: AppointmentCleanedValues;
}

/**
 * Normalizes phone number: digits only, preserving a single leading '+' only if typed.
 */
export function normalizePhone(input: string): string {
  const trimmed = (input || "").trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = digitsOf(trimmed);
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Returns current date (YYYY-MM-DD) and time (HH:mm) in Asia/Kolkata.
 */
export function istNow(d: Date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(d);

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  let hour = getPart("hour");
  if (hour === "24") hour = "00";
  const minute = getPart("minute");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

/**
 * Performs UTC calendar date arithmetic: adds n days to YYYY-MM-DD.
 */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + n);
  const resYear = date.getUTCFullYear();
  const resMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const resDay = String(date.getUTCDate()).padStart(2, "0");
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Formats YYYY-MM-DD into "Sat, 24 Oct 2026" using UTC.
 */
export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Formats "HH:mm" 24h string into "3:30 PM" (string math, no Date).
 */
export function formatTimeLabel(timeStr: string): string {
  const [hStr, mStr] = (timeStr || "").split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

/**
 * Formats a submission timestamp in India time: "24 Oct 2026, 2:05 PM".
 */
export function formatSubmittedAt(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return formatted.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
}

/**
 * Validates appointment input fields according to system constraints.
 */
export function validateAppointmentInput(
  input: AppointmentRawInput,
  now = istNow()
): AppointmentValidationResult {
  const errors: AppointmentFieldErrors = {};

  // 1. Name: trim, collapse whitespace, strip control characters, 2 to 80 characters
  let cleanName = "";
  if (typeof input.name === "string") {
    cleanName = input.name
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (!cleanName) {
    errors.name = "Full name is required.";
  } else if (cleanName.length < 2 || cleanName.length > 80) {
    errors.name = "Full name must be between 2 and 80 characters.";
  }

  // 2. Phone: via validatePhone
  let cleanPhone = "";
  const rawPhone = typeof input.phone === "string" ? input.phone : "";
  const phoneRes = validatePhone(rawPhone);
  if (!phoneRes.valid) {
    errors.phone = phoneRes.error || "Please enter a valid phone number.";
  } else {
    cleanPhone = normalizePhone(rawPhone);
  }

  // 3. Date: matches ^\d{4}-\d{2}-\d{2}$ and is a real calendar date; [today, today + 90 days]
  let cleanDate = "";
  const rawDate = typeof input.date === "string" ? input.date.trim() : "";
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!rawDate) {
    errors.date = "Preferred date is required.";
  } else if (!dateRegex.test(rawDate)) {
    errors.date = "Preferred date must be in YYYY-MM-DD format.";
  } else {
    const [y, m, d] = rawDate.split("-").map(Number);
    const calDate = new Date(Date.UTC(y, m - 1, d));
    if (
      calDate.getUTCFullYear() !== y ||
      calDate.getUTCMonth() !== m - 1 ||
      calDate.getUTCDate() !== d
    ) {
      errors.date = "Please enter a valid calendar date.";
    } else {
      const today = now.date;
      const maxDate = addDays(today, 90);
      if (rawDate < today) {
        errors.date = "Date cannot be in the past.";
      } else if (rawDate > maxDate) {
        errors.date = "Date cannot be more than 90 days in advance.";
      } else {
        cleanDate = rawDate;
      }
    }
  }

  // 4. Time: matches ^([01]\d|2[0-3]):[0-5]\d$; if date is today, must be later than now
  let cleanTime = "";
  const rawTime = typeof input.time === "string" ? input.time.trim() : "";
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!rawTime) {
    errors.time = "Preferred time is required.";
  } else if (!timeRegex.test(rawTime)) {
    errors.time = "Preferred time must be in HH:mm 24-hour format.";
  } else {
    if (cleanDate === now.date && rawTime <= now.time) {
      errors.time = "Selected time must be later than the current time.";
    } else {
      cleanTime = rawTime;
    }
  }

  // 5. Message: optional; trim; strip control characters except newline; collapse 3+ newlines to 2; max 500
  let cleanMessage: string | null = null;
  if (typeof input.message === "string") {
    let msg = input.message
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (msg.length > 500) {
      errors.message = "Message cannot exceed 500 characters.";
    } else if (msg.length > 0) {
      cleanMessage = msg;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: {
      name: cleanName,
      phone: cleanPhone,
      date: cleanDate,
      time: cleanTime,
      message: cleanMessage,
    },
  };
}

export interface RateLimitCounts {
  ipHour: number;
  ipDay: number;
  phoneDay: number;
  globalHour: number;
}

export interface RateLimits {
  ipHour?: number;
  ipDay?: number;
  phoneDay?: number;
  globalHour?: number;
}

export const DEFAULT_RATE_LIMITS: Required<RateLimits> = {
  ipHour: 5,
  ipDay: 20,
  phoneDay: 3,
  globalHour: 100,
};

export interface RateLimitResult {
  limited: boolean;
  reason?: "ip_hour" | "ip_day" | "phone_day" | "global_hour";
  retryAfterSeconds?: number;
}

/**
 * Pure rate limit evaluator.
 * Limits:
 * - per IP: 5 per hour, 20 per day
 * - per phone: 3 per day
 * - global: 100 per hour
 */
export function evaluateRateLimit(
  counts: RateLimitCounts,
  limits?: RateLimits
): RateLimitResult {
  const lim = { ...DEFAULT_RATE_LIMITS, ...limits };

  if (counts.ipHour >= lim.ipHour) {
    return { limited: true, reason: "ip_hour", retryAfterSeconds: 3600 };
  }
  if (counts.ipDay >= lim.ipDay) {
    return { limited: true, reason: "ip_day", retryAfterSeconds: 86400 };
  }
  if (counts.phoneDay >= lim.phoneDay) {
    return { limited: true, reason: "phone_day", retryAfterSeconds: 86400 };
  }
  if (counts.globalHour >= lim.globalHour) {
    return { limited: true, reason: "global_hour", retryAfterSeconds: 3600 };
  }

  return { limited: false };
}
