/**
 * Safely serializes data to a JSON string for embedding inside HTML <script> tags
 * (such as application/ld+json).
 *
 * Escapes characters that can break out of HTML script tags or cause parser issues:
 * - "<" -> \u003c (prevents closing </script> tags or comments)
 * - ">" -> \u003e (prevents HTML tag closing or comments)
 * - "&" -> \u0026 (prevents entity confusion)
 * - U+2028 -> \u2028 (Line Separator)
 * - U+2029 -> \u2029 (Paragraph Separator)
 *
 * In conforming JSON, \uXXXX escape sequences inside string literals parse back to
 * their original characters. If JSON.stringify returns undefined, returns "null".
 */
export function safeJsonLd(data: unknown): string {
  const json = JSON.stringify(data);
  if (json === undefined) {
    return "null";
  }
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
