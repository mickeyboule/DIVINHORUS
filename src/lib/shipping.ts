import type { SiteSettings } from '../types/cms';
import { findWorldCountry } from './countries';
import { COUNTRY_CURRENCY_LIST } from './currency';

export function getCountryDisplayName(
  countryCode?: string | null,
  lang: 'fr' | 'en' = 'fr',
): string {
  const code = (countryCode || '').toUpperCase().trim();
  if (!code) return 'International';
  const world = findWorldCountry(code, lang);
  if (world) return world.name;
  const known = COUNTRY_CURRENCY_LIST.find((c) => c.countryCode === code);
  if (known && lang === 'fr') return known.countryName;
  try {
    const dn = new Intl.DisplayNames([lang], { type: 'region' });
    return dn.of(code) || known?.countryName || code;
  } catch {
    return known?.countryName || code;
  }
}

export function resolveShippingFeeForCountry(
  countryCode: string | undefined | null,
  orderSettings?: SiteSettings['orderSettings'],
  lang: 'fr' | 'en' = 'fr',
): {
  fee: number;
  countryCode: string;
  countryName: string;
  isCountrySpecific: boolean;
} {
  const code = (countryCode || 'FR').toUpperCase().trim();
  const countryName = getCountryDisplayName(code, lang);
  const rules = orderSettings?.shippingRatesByCountry || [];
  const match = rules.find((r) => r.countryCode.toUpperCase().trim() === code);

  if (match && typeof match.fee === 'number' && Number.isFinite(match.fee)) {
    return {
      fee: Math.max(0, match.fee),
      countryCode: code,
      countryName: lang === 'fr' ? match.countryName || countryName : countryName,
      isCountrySpecific: true,
    };
  }

  const fallbackFee =
    typeof orderSettings?.defaultShippingFee === 'number' &&
    Number.isFinite(orderSettings.defaultShippingFee)
      ? Math.max(0, orderSettings.defaultShippingFee)
      : 0;

  return {
    fee: fallbackFee,
    countryCode: code,
    countryName,
    isCountrySpecific: false,
  };
}
