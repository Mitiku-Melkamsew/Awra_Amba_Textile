/**
 * Text formatting utilities for consistent UI presentation.
 */

/**
 * Converts a string to Title Case for consistent user-facing display.
 * Handles single words, multi-word phrases, slash-separated, and hyphen-separated text.
 * E.g.:
 *   "green" -> "Green"
 *   "cotton 40/1" -> "Cotton 40/1"
 *   "bahir dar textile" -> "Bahir Dar Textile"
 *   "plain-weave" -> "Plain-Weave"
 *   "warp/weft" -> "Warp/Weft"
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      // Handle slash-separated tokens like "warp/weft" or "40/1"
      if (word.includes("/")) {
        return word
          .split("/")
          .map((sub) => (sub ? sub.charAt(0).toUpperCase() + sub.slice(1) : ""))
          .join("/");
      }
      // Handle hyphen-separated tokens
      if (word.includes("-")) {
        return word
          .split("-")
          .map((sub) => (sub ? sub.charAt(0).toUpperCase() + sub.slice(1) : ""))
          .join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
