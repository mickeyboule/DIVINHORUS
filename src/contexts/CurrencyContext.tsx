import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  COUNTRY_CURRENCY_LIST,
  DEFAULT_RATES_FROM_EUR,
  convertEurAmount,
  formatAmountWithCurrency,
  formatConvertedPrice,
  getCountryCurrencyOption,
  getCurrencyOptionByCode,
  getLocalizedCountryCurrencyList,
  resolveVisitorCountry,
  setStoredCountryOverride,
  type CountryCurrencyOption,
} from '../lib/currency';
import type { GeoCurrencyInfo, SiteSettings } from '../types/cms';
import { useLanguage } from './LanguageContext';

interface CurrencyContextValue {
  countryOption: CountryCurrencyOption;
  isAutoDetected: boolean;
  autoEnabled: boolean;
  baseCurrencyCode: string;
  rates: Record<string, number>;
  availableCountries: CountryCurrencyOption[];
  setCountryOverride: (countryCode: string | null) => void;
  formatClientPrice: (amountInBase: number) => string;
  convertClientAmount: (amountInBase: number) => number;
}

const DEFAULT_OPTION = getCountryCurrencyOption('FR');

const CurrencyContext = createContext<CurrencyContextValue>({
  countryOption: DEFAULT_OPTION,
  isAutoDetected: true,
  autoEnabled: true,
  baseCurrencyCode: 'EUR',
  rates: DEFAULT_RATES_FROM_EUR,
  availableCountries: COUNTRY_CURRENCY_LIST,
  setCountryOverride: () => {},
  formatClientPrice: (amount) => formatAmountWithCurrency(amount, '€', 2),
  convertClientAmount: (amount) => amount,
});

interface CurrencyProviderProps {
  settings: SiteSettings;
  geo?: GeoCurrencyInfo;
  children: ReactNode;
}

export function CurrencyProvider({ settings, geo, children }: CurrencyProviderProps) {
  const { lang } = useLanguage();
  const autoEnabled = settings.general.autoCurrencyByCountry !== false;
  const baseCurrencyCode = (settings.general.currencyCode || 'EUR').toUpperCase().trim();
  const baseCurrencyMeta = useMemo(
    () => getCurrencyOptionByCode(baseCurrencyCode, settings.general.currencySymbol),
    [baseCurrencyCode, settings.general.currencySymbol],
  );

  const [resolved, setResolved] = useState<{ countryCode: string; isAutoDetected: boolean }>(() =>
    resolveVisitorCountry(geo),
  );

  useEffect(() => {
    setResolved(resolveVisitorCountry(geo));
  }, [geo]);

  const rates = useMemo(
    () => ({ ...DEFAULT_RATES_FROM_EUR, ...(geo?.rates || {}) }),
    [geo?.rates],
  );

  const availableCountries = useMemo(
    () => getLocalizedCountryCurrencyList(lang),
    [lang],
  );

  const countryOption = useMemo(
    () => getCountryCurrencyOption(resolved.countryCode, lang),
    [resolved.countryCode, lang],
  );

  const setCountryOverride = (countryCode: string | null) => {
    setStoredCountryOverride(countryCode);
    setResolved(resolveVisitorCountry(geo));
  };

  const value = useMemo<CurrencyContextValue>(
    () => ({
      countryOption,
      isAutoDetected: resolved.isAutoDetected,
      autoEnabled,
      baseCurrencyCode,
      rates,
      availableCountries,
      setCountryOverride,
      formatClientPrice: (amountInBase: number) => {
        if (!autoEnabled || baseCurrencyCode === 'CUSTOM') {
          return formatAmountWithCurrency(
            amountInBase,
            settings.general.currencySymbol,
            baseCurrencyMeta.decimals,
            lang,
          );
        }
        return formatConvertedPrice(amountInBase, countryOption, rates, baseCurrencyCode, lang);
      },
      convertClientAmount: (amountInBase: number) => {
        if (!autoEnabled || baseCurrencyCode === 'CUSTOM') return amountInBase;
        return convertEurAmount(amountInBase, countryOption, rates, baseCurrencyCode);
      },
    }),
    [
      countryOption,
      resolved.isAutoDetected,
      autoEnabled,
      baseCurrencyCode,
      baseCurrencyMeta.decimals,
      rates,
      availableCountries,
      settings.general.currencySymbol,
      lang,
    ],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
