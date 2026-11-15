// Compact ISO 3166-1 alpha-2 -> country name map for the analytics dashboard.
// Unlisted codes fall back to the code itself.

const COUNTRIES: Record<string, string> = {
  KE: 'Kenya', UG: 'Uganda', TZ: 'Tanzania', RW: 'Rwanda', ET: 'Ethiopia', SO: 'Somalia', SS: 'South Sudan',
  NG: 'Nigeria', GH: 'Ghana', ZA: 'South Africa', EG: 'Egypt', MA: 'Morocco', DZ: 'Algeria', TN: 'Tunisia',
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina',
  GB: 'United Kingdom', IE: 'Ireland', FR: 'France', DE: 'Germany', NL: 'Netherlands', BE: 'Belgium',
  ES: 'Spain', PT: 'Portugal', IT: 'Italy', CH: 'Switzerland', AT: 'Austria', SE: 'Sweden', NO: 'Norway',
  DK: 'Denmark', FI: 'Finland', PL: 'Poland', CZ: 'Czechia', RO: 'Romania', GR: 'Greece', UA: 'Ukraine',
  RU: 'Russia', TR: 'Turkey', IL: 'Israel', AE: 'United Arab Emirates', SA: 'Saudi Arabia', QA: 'Qatar',
  IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', CN: 'China', JP: 'Japan', KR: 'South Korea',
  SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines', TH: 'Thailand', VN: 'Vietnam',
  AU: 'Australia', NZ: 'New Zealand',
};

export function countryName(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  const upper = code.toUpperCase();
  return COUNTRIES[upper] ?? upper;
}

// Regional-indicator flag emoji from a 2-letter code.
export function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '';
  return String.fromCodePoint(...[...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
