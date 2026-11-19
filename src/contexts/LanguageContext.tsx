import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translate, type AppLanguage, type TranslationKey } from '../lib/i18n';

const LANG_STORAGE_KEY = 'dh_lang_v1';

function detectInitialLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {
    // Ignore storage access errors
  }

  try {
    const browserLangs = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    for (const entry of browserLangs) {
      if (!entry) continue;
      const lower = entry.toLowerCase();
      if (lower.startsWith('fr')) return 'fr';
      if (lower.startsWith('en')) return 'en';
    }
  } catch {
    // Ignore navigator errors
  }

  return 'fr';
}

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (next: AppLanguage) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fr',
  setLang: () => {},
  toggleLang: () => {},
  t: (key, vars) => translate('fr', key, vars),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(() => detectInitialLanguage());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'fr' ? 'en' : 'fr');
  }, [lang, setLang]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
