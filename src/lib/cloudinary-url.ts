/**
 * Shared Cloudinary URL Validator for Namma Vanigam.
 *
 * Rules:
 * - Must be a valid URL string
 * - Protocol must strictly be 'https:' (rejects 'http:' and any other protocol)
 * - Hostname must equal 'res.cloudinary.com' exactly
 * - Path must start with /<CLOUDINARY_CLOUD_NAME>/image/upload/...
 *   (segments[0] = cloud name, segments[1] = "image", segments[2] = "upload")
 * - Returns false if CLOUDINARY_CLOUD_NAME is unset or URL is malformed
 */
export function isValidCloudinaryUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return false;

    // Protocol must strictly be https:
    if (parsed.protocol !== "https:") return false;

    // Hostname must equal res.cloudinary.com exactly
    if (parsed.hostname !== "res.cloudinary.com") return false;

    // Path segments: /<cloud_name>/image/upload/...
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 3) return false;
    if (segments[0] !== cloudName) return false;
    if (segments[1] !== "image") return false;
    if (segments[2] !== "upload") return false;

    return true;
  } catch {
    return false;
  }
}
