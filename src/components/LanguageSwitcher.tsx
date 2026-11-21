import { useLanguage } from '../contexts/LanguageContext';
import type { AppLanguage } from '../lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'dark';
}

export function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLanguage();

  const options: Array<{ code: AppLanguage; short: string; label: string }> = [
    { code: 'fr', short: 'FR', label: t('nav.langFr') },
    { code: 'en', short: 'EN', label: t('nav.langEn') },
  ];

  if (variant === 'dark') {
    return (
      <div
        role="group"
        aria-label={t('nav.languageLabel')}
        className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 p-0.5 shrink-0"
      >
        {options.map((opt) => {
          const active = lang === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLang(opt.code)}
              aria-pressed={active}
              title={opt.label}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                active ? 'bg-[#8F6B18] text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              {opt.short}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={t('nav.languageLabel')}
      className="inline-flex items-center rounded-lg border border-[#E6E4DF] bg-white p-0.5 shrink-0"
    >
      {options.map((opt) => {
        const active = lang === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLang(opt.code)}
            aria-pressed={active}
            title={opt.label}
            className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
              active
                ? 'bg-[#8F6B18] text-white'
                : 'text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            {variant === 'full' ? `${opt.short} · ${opt.label}` : opt.short}
          </button>
        );
      })}
    </div>
  );
}
