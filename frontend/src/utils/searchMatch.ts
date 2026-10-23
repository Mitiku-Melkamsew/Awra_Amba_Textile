const normalize = (text: string) => text.toLowerCase().normalize("NFC");

/** Splits typed text into words; spaces, hyphens, slashes, dots and commas all separate words. */
export const searchWords = (text: string) =>
  normalize(text)
    .split(/[\s\-/·,.]+/)
    .filter(Boolean);

export const searchHaystack = (text: string) => normalize(text);

/** True when every typed word appears somewhere in the text, in any order. */
export function matchesAllWords(haystack: string, words: string[]): boolean {
  return words.length > 0 && words.every((w) => haystack.includes(w));
}
