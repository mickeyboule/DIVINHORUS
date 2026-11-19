import type { GeoCurrencyInfo } from '../types/cms';

export interface CountryCurrencyOption {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  decimals: number;
}

export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€', decimals: 2 },
  { code: 'XOF', label: 'Franc CFA — Afrique de l’Ouest / UEMOA (XOF)', symbol: 'FCFA', decimals: 0 },
  { code: 'XAF', label: 'Franc CFA — Afrique Centrale / CEMAC (XAF)', symbol: 'FCFA', decimals: 0 },
  { code: 'USD', label: 'Dollar américain (USD)', symbol: '$ US', decimals: 2 },
  { code: 'CAD', label: 'Dollar canadien (CAD)', symbol: '$ CA', decimals: 2 },
  { code: 'CHF', label: 'Franc suisse (CHF)', symbol: 'CHF', decimals: 2 },
  { code: 'GBP', label: 'Livre sterling (GBP)', symbol: '£', decimals: 2 },
  { code: 'MAD', label: 'Dirham marocain (MAD)', symbol: 'DH', decimals: 2 },
  { code: 'TND', label: 'Dinar tunisien (TND)', symbol: 'DT', decimals: 2 },
  { code: 'DZD', label: 'Dinar algérien (DZD)', symbol: 'DA', decimals: 0 },
  { code: 'CDF', label: 'Franc congolais (CDF)', symbol: 'FC', decimals: 0 },
  { code: 'GNF', label: 'Franc guinéen (GNF)', symbol: 'GNF', decimals: 0 },
  { code: 'MGA', label: 'Ariary malgache (MGA)', symbol: 'Ar', decimals: 0 },
  { code: 'HTG', label: 'Gourde haïtienne (HTG)', symbol: 'HTG', decimals: 0 },
];

export function getCurrencyOptionByCode(code?: string | null, fallbackSymbol = '€'): CurrencyOption {
  const norm = (code || 'EUR').toUpperCase().trim();
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === norm);
  if (found) return found;
  return {
    code: norm || 'CUSTOM',
    label: `Devise personnalisée (${fallbackSymbol})`,
    symbol: fallbackSymbol,
    decimals: 2,
  };
}

export const DEFAULT_RATES_FROM_EUR: Record<string, number> = {
  EUR: 1,
  XOF: 655.957,
  XAF: 655.957,
  USD: 1.08,
  CAD: 1.5,
  CHF: 0.94,
  GBP: 0.84,
  MAD: 10.85,
  TND: 3.38,
  DZD: 145,
  CDF: 3050,
  GNF: 9300,
  MGA: 4950,
  HTG: 142,
};

export const COUNTRY_CURRENCY_LIST: CountryCurrencyOption[] = [
  // Zone Euro
  { countryCode: 'FR', countryName: 'France', currencyCode: 'EUR', currencySymbol: '€', decimals: 2 },
  { countryCode: 'BE', countryName: 'Belgique', currencyCode: 'EUR', currencySymbol: '€', decimals: 2 },
  { countryCode: 'LU', countryName: 'Luxembourg', currencyCode: 'EUR', currencySymbol: '€', decimals: 2 },
  { countryCode: 'DE', countryName: 'Allemagne', currencyCode: 'EUR', currencySymbol: '€', decimals: 2 },
  { countryCode: 'ES', countryName: 'Espagne', currencyCode: 'EUR', currencySymbol: '€', decimals: 2 },
  { countryCode: 'IT', countryName: 'Italie', currencyCode: 'EUR', currencySymbol: '€', decimals: 2 },
  { countryCode: 'PT', countryName: 'Portugal', currencyCode: 'EUR', currencySymbol: '€', decimals: 2 },
  { countryCode: 'NL', countryName: 'Pays-Bas', currencyCode: 'EUR', currencySymbol: '€', decimals: 2 },

  // Suisse & Royaume-Uni
  { countryCode: 'CH', countryName: 'Suisse', currencyCode: 'CHF', currencySymbol: 'CHF', decimals: 2 },
  { countryCode: 'GB', countryName: 'Royaume-Uni', currencyCode: 'GBP', currencySymbol: '£', decimals: 2 },

  // Afrique de l'Ouest (UEMOA - XOF)
  { countryCode: 'CI', countryName: 'Côte d’Ivoire', currencyCode: 'XOF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'SN', countryName: 'Sénégal', currencyCode: 'XOF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'BJ', countryName: 'Bénin', currencyCode: 'XOF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'BF', countryName: 'Burkina Faso', currencyCode: 'XOF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'ML', countryName: 'Mali', currencyCode: 'XOF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'TG', countryName: 'Togo', currencyCode: 'XOF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'NE', countryName: 'Niger', currencyCode: 'XOF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'GW', countryName: 'Guinée-Bissau', currencyCode: 'XOF', currencySymbol: 'FCFA', decimals: 0 },

  // Afrique Centrale (CEMAC - XAF)
  { countryCode: 'CM', countryName: 'Cameroun', currencyCode: 'XAF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'GA', countryName: 'Gabon', currencyCode: 'XAF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'CG', countryName: 'Congo-Brazzaville', currencyCode: 'XAF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'TD', countryName: 'Tchad', currencyCode: 'XAF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'CF', countryName: 'Centrafrique', currencyCode: 'XAF', currencySymbol: 'FCFA', decimals: 0 },
  { countryCode: 'GQ', countryName: 'Guinée équatoriale', currencyCode: 'XAF', currencySymbol: 'FCFA', decimals: 0 },

  // Autres pays d'Afrique
  { countryCode: 'CD', countryName: 'RD Congo', currencyCode: 'CDF', currencySymbol: 'FC', decimals: 0 },
  { countryCode: 'GN', countryName: 'Guinée', currencyCode: 'GNF', currencySymbol: 'GNF', decimals: 0 },
  { countryCode: 'MA', countryName: 'Maroc', currencyCode: 'MAD', currencySymbol: 'DH', decimals: 2 },
  { countryCode: 'TN', countryName: 'Tunisie', currencyCode: 'TND', currencySymbol: 'DT', decimals: 2 },
  { countryCode: 'DZ', countryName: 'Algérie', currencyCode: 'DZD', currencySymbol: 'DA', decimals: 0 },
  { countryCode: 'MG', countryName: 'Madagascar', currencyCode: 'MGA', currencySymbol: 'Ar', decimals: 0 },

  // Amériques
  { countryCode: 'CA', countryName: 'Canada', currencyCode: 'CAD', currencySymbol: '$ CA', decimals: 2 },
  { countryCode: 'US', countryName: 'États-Unis', currencyCode: 'USD', currencySymbol: '$ US', decimals: 2 },
  { countryCode: 'HT', countryName: 'Haïti', currencyCode: 'HTG', currencySymbol: 'HTG', decimals: 0 },
];

const OTHER_EUROZONE_CODES = new Set([
  'AT', 'CY', 'EE', 'FI', 'GR', 'HR', 'IE', 'LT', 'LV', 'MC', 'MT', 'SI', 'SK', 'GP', 'MQ', 'GF', 'RE', 'YT',
]);

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Europe/Paris': 'FR',
  'Europe/Brussels': 'BE',
  'Europe/Luxembourg': 'LU',
  'Europe/Zurich': 'CH',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Lisbon': 'PT',
  'Europe/Amsterdam': 'NL',
  'Africa/Abidjan': 'CI',
  'Africa/Dakar': 'SN',
  'Africa/Porto-Novo': 'BJ',
  'Africa/Ouagadougou': 'BF',
  'Africa/Bamako': 'ML',
  'Africa/Lome': 'TG',
  'Africa/Niamey': 'NE',
  'Africa/Bissau': 'GW',
  'Africa/Douala': 'CM',
  'Africa/Libreville': 'GA',
  'Africa/Brazzaville': 'CG',
  'Africa/Ndjamena': 'TD',
  'Africa/Bangui': 'CF',
  'Africa/Malabo': 'GQ',
  'Africa/Kinshasa': 'CD',
  'Africa/Lubumbashi': 'CD',
  'Africa/Conakry': 'GN',
  'Africa/Casablanca': 'MA',
  'Africa/Tunis': 'TN',
  'Africa/Algiers': 'DZ',
  'Indian/Antananarivo': 'MG',
  'America/Toronto': 'CA',
  'America/Montreal': 'CA',
  'America/Vancouver': 'CA',
  'America/Halifax': 'CA',
  'America/Winnipeg': 'CA',
  'America/Edmonton': 'CA',
  'America/New_York': 'US',
  'America/Los_Angeles': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Port-au-Prince': 'HT',
};

const STORAGE_KEY = 'dh_country_override';

export function getLocalizedCountryCurrencyList(
  lang: 'fr' | 'en' = 'fr',
): CountryCurrencyOption[] {
  if (lang === 'fr') return COUNTRY_CURRENCY_LIST;
  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    dn = null;
  }
  return COUNTRY_CURRENCY_LIST.map((item) => ({
    ...item,
    countryName: (dn && dn.of(item.countryCode)) || item.countryName,
  }));
}

export function getCountryCurrencyOption(
  countryCode?: string | null,
  lang: 'fr' | 'en' = 'fr',
): CountryCurrencyOption {
  const code = (countryCode || 'FR').toUpperCase().trim();
  const list = getLocalizedCountryCurrencyList(lang);
  const exact = list.find((c) => c.countryCode === code);
  if (exact) return exact;

  if (OTHER_EUROZONE_CODES.has(code)) {
    return {
      countryCode: code,
      countryName: lang === 'en' ? 'Eurozone' : 'Zone Euro',
      currencyCode: 'EUR',
      currencySymbol: '€',
      decimals: 2,
    };
  }

  return {
    countryCode: code || 'INTL',
    countryName: 'International',
    currencyCode: 'USD',
    currencySymbol: '$ US',
    decimals: 2,
  };
}

export function getStoredCountryOverride(): string | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? val.toUpperCase().trim() : null;
  } catch {
    return null;
  }
}

export function setStoredCountryOverride(countryCode: string | null): void {
  try {
    if (countryCode && countryCode.trim()) {
      localStorage.setItem(STORAGE_KEY, countryCode.toUpperCase().trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore restricted storage errors
  }
}

function detectCountryFromBrowser(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz];
    }
  } catch {
    // Ignore
  }

  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const lang of langs) {
      if (!lang) continue;
      const parts = lang.split(/[-_]/);
      if (parts.length >= 2) {
        const region = parts[parts.length - 1].toUpperCase();
        if (/^[A-Z]{2}$/.test(region)) {
          return region;
        }
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

export function resolveVisitorCountry(serverGeo?: GeoCurrencyInfo | null): {
  countryCode: string;
  isAutoDetected: boolean;
} {
  const override = getStoredCountryOverride();
  if (override) {
    return { countryCode: override, isAutoDetected: false };
  }

  if (serverGeo && (serverGeo.source === 'header' || serverGeo.source === 'ip') && serverGeo.countryCode) {
    return { countryCode: serverGeo.countryCode.toUpperCase(), isAutoDetected: true };
  }

  const browserCountry = detectCountryFromBrowser();
  if (browserCountry) {
    return { countryCode: browserCountry, isAutoDetected: true };
  }

  if (serverGeo?.countryCode) {
    return { countryCode: serverGeo.countryCode.toUpperCase(), isAutoDetected: true };
  }

  return { countryCode: 'FR', isAutoDetected: true };
}

export function convertCurrencyAmount(
  amount: number,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  toDecimals: number,
  rates?: Record<string, number>,
): number {
  const fromCode = (fromCurrencyCode || 'EUR').toUpperCase().trim();
  const toCode = (toCurrencyCode || 'EUR').toUpperCase().trim();
  if (fromCode === toCode) {
    return toDecimals === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
  }
  const fromRate = rates?.[fromCode] ?? DEFAULT_RATES_FROM_EUR[fromCode] ?? 1;
  const toRate = rates?.[toCode] ?? DEFAULT_RATES_FROM_EUR[toCode] ?? 1;
  const amountInEur = fromRate > 0 ? amount / fromRate : amount;
  const raw = amountInEur * toRate;
  if (toDecimals === 0) {
    return Math.round(raw);
  }
  return Math.round(raw * 100) / 100;
}

export function convertEurAmount(
  amount: number,
  option: CountryCurrencyOption,
  rates?: Record<string, number>,
  fromCurrencyCode = 'EUR',
): number {
  return convertCurrencyAmount(
    amount,
    fromCurrencyCode,
    option.currencyCode,
    option.decimals,
    rates,
  );
}

export function formatAmountWithCurrency(
  amount: number,
  currencySymbol: string,
  decimals = 2,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isWhole = amount % 1 === 0;
  const minFrac = decimals === 0 ? 0 : isWhole ? 0 : Math.min(2, decimals);
  const maxFrac = decimals === 0 ? 0 : 2;
  const formatted = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'fr-FR', {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  }).format(amount);
  return `${formatted} ${currencySymbol}`;
}

export function formatConvertedPrice(
  amount: number,
  option: CountryCurrencyOption,
  rates?: Record<string, number>,
  fromCurrencyCode = 'EUR',
  lang: 'fr' | 'en' = 'fr',
): string {
  const converted = convertEurAmount(amount, option, rates, fromCurrencyCode);
  return formatAmountWithCurrency(converted, option.currencySymbol, option.decimals, lang);
}
