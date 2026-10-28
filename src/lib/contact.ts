// Shared contact & social media validation helpers used by both client and server

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "youtube"
  | "x"
  | "linkedin"
  | "telegram";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "facebook",
  "instagram",
  "youtube",
  "x",
  "linkedin",
  "telegram",
];

export const PLATFORM_META: Record<
  SocialPlatform,
  {
    label: string;
    placeholder: string;
    domains: string[];
  }
> = {
  facebook: {
    label: "Facebook",
    placeholder: "https://facebook.com/yourpage",
    domains: ["facebook.com", "fb.com", "fb.me"],
  },
  instagram: {
    label: "Instagram",
    placeholder: "https://instagram.com/yourprofile",
    domains: ["instagram.com", "instagr.am"],
  },
  youtube: {
    label: "YouTube",
    placeholder: "https://youtube.com/@yourchannel",
    domains: ["youtube.com", "youtu.be"],
  },
  x: {
    label: "X (Twitter)",
    placeholder: "https://x.com/yourhandle",
    domains: ["x.com", "twitter.com"],
  },
  linkedin: {
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/yourcompany",
    domains: ["linkedin.com"],
  },
  telegram: {
    label: "Telegram",
    placeholder: "https://t.me/yourchannel",
    domains: ["t.me", "telegram.me"],
  },
};

/**
 * Strips ASCII control characters (0x00-0x1F, 0x7F) from a string.
 */
export function stripControlCharacters(str: string): string {
  return str.replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Sanitizes phone label by stripping control characters and trimming.
 */
export function sanitizePhoneLabel(label?: string | null): string {
  if (!label) return "";
  return stripControlCharacters(label).trim();
}

/**
 * Validates optional phone label (max 30 chars after stripping control characters).
 */
export function validatePhoneLabel(label?: string | null): { valid: boolean; error?: string } {
  if (!label) return { valid: true };
  const sanitized = sanitizePhoneLabel(label);
  if (sanitized.length > 30) {
    return { valid: false, error: "Label cannot exceed 30 characters." };
  }
  return { valid: true };
}

/**
 * Returns only digits of a phone number.
 */
export function digitsOf(number: string): string {
  return (number || "").replace(/\D/g, "");
}

/**
 * Returns "tel:" + optional leading "+" + digits only.
 */
export function telHref(number: string): string {
  const trimmed = (number || "").trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = digitsOf(trimmed);
  return `tel:${hasLeadingPlus ? "+" : ""}${digits}`;
}

/**
 * Validates a single phone number:
 * - trim
 * - allowed characters: digits, spaces, + (only as first char), -, (, ), .
 * - 7 to 15 digits
 */
export function validatePhone(input: string): { valid: boolean; error?: string } {
  if (!input || typeof input !== "string") {
    return { valid: false, error: "Phone number is required." };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: "Phone number is required." };
  }

  // Allowed characters: digits, spaces, +, -, (, ), .
  const allowedRegex = /^[+]?[\d\s\-().]+$/;
  if (!allowedRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Phone number contains invalid characters. Only digits, spaces, +, -, (, ), and . are allowed.",
    };
  }

  // Ensure + does not appear anywhere after index 0
  if (trimmed.indexOf("+", 1) !== -1) {
    return {
      valid: false,
      error: "'+' is only allowed as the first character.",
    };
  }

  const digits = digitsOf(trimmed);
  if (digits.length < 7 || digits.length > 15) {
    return {
      valid: false,
      error: "Phone number must contain between 7 and 15 digits.",
    };
  }

  return { valid: true };
}

export interface AdditionalPhoneInput {
  number: string;
  label?: string | null;
}

/**
 * Validates an array of additional phone numbers against limits, format, and duplication.
 */
export function validateAdditionalPhones(
  phones: AdditionalPhoneInput[],
  primaryPhone?: string | null
): { valid: boolean; error?: string } {
  if (!Array.isArray(phones)) {
    return { valid: false, error: "additionalPhones must be an array." };
  }

  if (phones.length > 4) {
    return { valid: false, error: "At most 4 additional phone numbers are allowed." };
  }

  const seenDigits = new Set<string>();
  if (primaryPhone && primaryPhone.trim()) {
    const primaryDigits = digitsOf(primaryPhone);
    if (primaryDigits) {
      seenDigits.add(primaryDigits);
    }
  }

  for (let i = 0; i < phones.length; i++) {
    const item = phones[i];
    if (!item || typeof item.number !== "string" || !item.number.trim()) {
      return { valid: false, error: `additionalPhones[${i}].number is required.` };
    }

    const numVal = validatePhone(item.number);
    if (!numVal.valid) {
      return { valid: false, error: `additionalPhones[${i}].number: ${numVal.error}` };
    }

    const labelVal = validatePhoneLabel(item.label);
    if (!labelVal.valid) {
      return { valid: false, error: `additionalPhones[${i}].label: ${labelVal.error}` };
    }

    const digits = digitsOf(item.number);
    if (seenDigits.has(digits)) {
      if (primaryPhone && digits === digitsOf(primaryPhone)) {
        return {
          valid: false,
          error: `additionalPhones[${i}].number cannot be a duplicate of the primary phone number.`,
        };
      }
      return {
        valid: false,
        error: `additionalPhones[${i}].number is a duplicate phone number.`,
      };
    }
    seenDigits.add(digits);
  }

  return { valid: true };
}

export type NormalizeSocialUrlResult =
  | { success: true; url: string; error?: never }
  | { success: false; error: string; url?: never };

/**
 * Normalizes and validates a social media URL for a given platform.
 */
export function normalizeSocialUrl(
  platform: SocialPlatform | string,
  input: string
): NormalizeSocialUrlResult {
  if (!input || typeof input !== "string") {
    return { success: false, error: "URL is required." };
  }

  let trimmed = input.trim();
  if (!trimmed) {
    return { success: false, error: "URL cannot be empty." };
  }

  const p = (platform || "").toLowerCase() as SocialPlatform;
  const meta = PLATFORM_META[p];
  if (!meta) {
    return { success: false, error: `Unsupported social platform "${platform}".` };
  }

  // If there is no scheme, prefix https://
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { success: false, error: `Invalid URL format for ${meta.label}.` };
  }

  // Upgrade http to https; reject any other scheme
  if (parsed.protocol === "http:") {
    parsed.protocol = "https:";
  } else if (parsed.protocol !== "https:") {
    return {
      success: false,
      error: `Invalid URL scheme "${parsed.protocol}". Only HTTP/HTTPS links are allowed.`,
    };
  }

  // Reject any URL containing credentials
  if (parsed.username || parsed.password) {
    return {
      success: false,
      error: "URL must not contain credentials.",
    };
  }

  // Lowercase hostname and strip leading "www." or "m."
  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith("www.")) {
    hostname = hostname.slice(4);
  } else if (hostname.startsWith("m.")) {
    hostname = hostname.slice(2);
  }

  // Check if hostname equals one of the allowed domains
  if (!meta.domains.includes(hostname)) {
    return {
      success: false,
      error: `Domain must be ${meta.domains.join(" or ")} for ${meta.label}.`,
    };
  }

  // Assign normalized hostname
  parsed.hostname = hostname;

  // The path must not be empty (e.g. "/" or "" has no handle/page)
  const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, "");
  if (!cleanPath) {
    return {
      success: false,
      error: `Path must not be empty. Please include your ${meta.label} profile or page.`,
    };
  }

  const finalUrl = parsed.toString();
  if (finalUrl.length > 300) {
    return {
      success: false,
      error: "URL must not exceed 300 characters.",
    };
  }

  return { success: true, url: finalUrl };
}

export interface SocialLinkInput {
  platform: string;
  url: string;
}

/**
 * Validates an array of social links for uniqueness of platform, format, and allowed domains.
 */
export function validateSocialLinks(
  links: SocialLinkInput[]
): { valid: boolean; error?: string; data?: Array<{ platform: SocialPlatform; url: string }> } {
  if (!Array.isArray(links)) {
    return { valid: false, error: "socialLinks must be an array." };
  }

  const seenPlatforms = new Set<string>();
  const validatedList: Array<{ platform: SocialPlatform; url: string }> = [];

  for (let i = 0; i < links.length; i++) {
    const item = links[i];
    if (!item || typeof item.platform !== "string") {
      return { valid: false, error: `socialLinks[${i}].platform is required.` };
    }

    const platform = item.platform.toLowerCase() as SocialPlatform;
    if (!SOCIAL_PLATFORMS.includes(platform)) {
      return {
        valid: false,
        error: `socialLinks[${i}].platform "${item.platform}" is not supported.`,
      };
    }

    if (seenPlatforms.has(platform)) {
      return {
        valid: false,
        error: `socialLinks[${i}].platform: Duplicate entry for platform "${platform}".`,
      };
    }
    seenPlatforms.add(platform);

    if (typeof item.url !== "string" || !item.url.trim()) {
      return { valid: false, error: `socialLinks[${i}].url is required.` };
    }

    const res = normalizeSocialUrl(platform, item.url);
    if (!res.success || !res.url) {
      return {
        valid: false,
        error: `socialLinks[${i}].url: ${res.error}`,
      };
    }

    validatedList.push({
      platform,
      url: res.url,
    });
  }

  return { valid: true, data: validatedList };
}
