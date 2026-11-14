// Amount in words for the "AMOUNT IN WORDS" line on a document.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const SCALES = ['', 'thousand', 'million', 'billion', 'trillion'];

const CURRENCY_NAMES: Record<string, { major: string; minor: string }> = {
  KES: { major: 'Kenya shillings', minor: 'cents' },
  USD: { major: 'US dollars', minor: 'cents' },
  EUR: { major: 'euros', minor: 'cents' },
  GBP: { major: 'pounds', minor: 'pence' },
  UGX: { major: 'Uganda shillings', minor: 'cents' },
  TZS: { major: 'Tanzania shillings', minor: 'cents' },
};

function underThousand(n: number): string {
  let out = '';
  if (n >= 100) {
    out += `${ONES[Math.floor(n / 100)]} hundred`;
    n %= 100;
    if (n) out += ' and ';
  }
  if (n >= 20) {
    out += TENS[Math.floor(n / 10)];
    if (n % 10) out += `-${ONES[n % 10]}`;
  } else if (n > 0) {
    out += ONES[n];
  }
  return out;
}

function toWords(n: number): string {
  if (n === 0) return 'zero';
  const groups: string[] = [];
  let scale = 0;
  while (n > 0 && scale < SCALES.length) {
    const chunk = n % 1000;
    if (chunk) groups.unshift(`${underThousand(chunk)}${SCALES[scale] ? ` ${SCALES[scale]}` : ''}`);
    n = Math.floor(n / 1000);
    scale += 1;
  }
  return groups.join(', ');
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// 499200 KES -> "Four hundred and ninety-nine thousand, two hundred Kenya shillings only."
export function amountInWords(amount: number, currency: string): string {
  const safe = Math.max(0, Math.round((Number(amount) || 0) * 100) / 100);
  const major = Math.floor(safe);
  const minor = Math.round((safe - major) * 100);
  const names = CURRENCY_NAMES[currency] ?? { major: currency, minor: 'cents' };

  let text = `${toWords(major)} ${names.major}`;
  if (minor > 0) text += ` and ${toWords(minor)} ${names.minor}`;
  return `${titleCase(text)} only.`;
}
