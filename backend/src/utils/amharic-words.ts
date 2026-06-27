const ones = ["", "አንድ", "ሁለት", "ሦስት", "አራት", "አምስት", "ስድስት", "ሰባት", "ስምንት", "ዘጠኝ"];
const tens = ["", "አስር", "ሃያ", "ሰላሳ", "አርባ", "ሃምሳ", "ስልሳ", "ሰባ", "ሰማንያ", "ዘጠና"];
const teens = [
  "አስር",
  "አስራ አንድ",
  "አስራ ሁለት",
  "አስራ ሦስት",
  "አስራ አራት",
  "አስራ አምስት",
  "አስራ ስድስት",
  "አስራ ሰባት",
  "አስራ ስምንት",
  "አስራ ዘጠኝ",
];

function convertHundreds(num: number): string {
  const words: string[] = [];
  const h = Math.floor(num / 100);
  const rem = num % 100;

  if (h > 0) {
    words.push(h === 1 ? "አንድ መቶ" : `${ones[h]} መቶ`);
  }

  if (rem > 0) {
    if (rem < 10) words.push(ones[rem]);
    else if (rem < 20) words.push(teens[rem - 10]);
    else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      words.push(tens[t]);
      if (o > 0) words.push(ones[o]);
    }
  }

  return words.join(" ");
}

export function numberToAmharicWords(n: number): string {
  if (n === 0) return "ዜሮ";
  if (n < 0) return `ኔጌቲቭ ${numberToAmharicWords(-n)}`;

  const parts: string[] = [];
  let remaining = Math.floor(n);
  const millions = Math.floor(remaining / 1_000_000);
  remaining %= 1_000_000;
  const thousands = Math.floor(remaining / 1_000);
  remaining %= 1_000;

  if (millions > 0) parts.push(`${convertHundreds(millions)} ሚሊዮን`);
  if (thousands > 0) parts.push(`${convertHundreds(thousands)} ሺህ`);
  if (remaining > 0) parts.push(convertHundreds(remaining));

  return parts.join(" ");
}