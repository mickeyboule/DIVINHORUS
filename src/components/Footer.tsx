import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { SiteSettings } from '../types/cms';
import { LanguageSwitcher } from './LanguageSwitcher';

interface FooterProps {
  onNavigate: (path: string) => void;
  settings: SiteSettings;
}

export function Footer({ onNavigate, settings }: FooterProps) {
  const { countryOption, autoEnabled, availableCountries, setCountryOverride } = useCurrency();
  const { t } = useLanguage();
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [settings.general.logoUrl]);

  const socials = [
    { label: 'YouTube', url: settings.socials.youtube },
    { label: 'TikTok', url: settings.socials.tiktok },
    { label: 'Facebook', url: settings.socials.facebook },
    { label: 'Telegram', url: settings.socials.telegram },
  ].filter((s) => s.url && s.url.trim().length > 0);

  return (
    <footer className="border-t border-[#E6E4DF] bg-[#F3F2EE] text-[#141413]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              {settings.general.logoUrl && !logoFailed ? (
                <img
                  src={settings.general.logoUrl}
                  alt={settings.general.siteName}
                  className="h-9 w-auto max-w-[150px] object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                />
              ) : null}
              <p className="font-display text-2xl font-semibold tracking-tight">
                {settings.general.siteName}
              </p>
            </div>
            <p className="mt-3 text-sm text-[#5C5A55] leading-relaxed max-w-md">
              {t('footer.taglineDescription', { tagline: settings.general.tagline })}
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold tracking-wide text-[#5C5A55] mb-3">
              {t('nav.navigation')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="text-[#141413] hover:text-[#8F6B18] transition-colors"
                >
                  {t('nav.home')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/boutique')}
                  className="text-[#141413] hover:text-[#8F6B18] transition-colors"
                >
                  {t('nav.shop')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/communaute')}
                  className="text-[#141413] hover:text-[#8F6B18] transition-colors"
                >
                  {t('nav.community')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/a-propos')}
                  className="text-[#141413] hover:text-[#8F6B18] transition-colors"
                >
                  {t('nav.about')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="text-[#141413] hover:text-[#8F6B18] transition-colors"
                >
                  {t('nav.contact')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/suivi-commande')}
                  className="text-[#141413] hover:text-[#8F6B18] transition-colors"
                >
                  {t('nav.trackOrder')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/mon-compte')}
                  className="text-[#141413] hover:text-[#8F6B18] transition-colors"
                >
                  {t('nav.myAccountFull')}
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold tracking-wide text-[#5C5A55] mb-3">
              {t('footer.sanctuaryHeading')}
            </h3>
            <div className="space-y-1.5 text-sm text-[#5C5A55]">
              <p className="text-[#141413] font-medium">{settings.contact.address}</p>
              <p>
                {settings.contact.city}, {settings.contact.country}
              </p>
              <p className="pt-1">{settings.contact.phone}</p>
              <p>{settings.contact.email}</p>
            </div>
            {socials.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-[#8F6B18]">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#E2DFD9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#6B6860]">
          <p>
            {t('footer.rightsReserved', {
              year: new Date().getFullYear(),
              siteName: settings.general.siteName,
            })}
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <LanguageSwitcher variant="compact" />
            {autoEnabled && (
              <div className="inline-flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#8F6B18]" />
                <label htmlFor="footer-country-currency" className="sr-only">
                  {t('footer.countryCurrencyLabel')}
                </label>
                <select
                  id="footer-country-currency"
                  value={countryOption.countryCode}
                  onChange={(e) => setCountryOverride(e.target.value)}
                  className="bg-white border border-[#D9D6CF] rounded-md px-2 py-1 text-xs text-[#141413] focus:border-[#8F6B18] focus:outline-none"
                >
                  {availableCountries.map((opt) => (
                    <option key={opt.countryCode} value={opt.countryCode}>
                      {opt.countryName} · {opt.currencyCode} ({opt.currencySymbol})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="text-[11px] text-[#8A877E]">{settings.general.tagline}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
