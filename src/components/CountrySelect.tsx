import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { findWorldCountry, getWorldCountries } from '../lib/countries';

interface CountrySelectProps {
  value: string;
  onChange: (countryCode: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

export function CountrySelect({
  value,
  onChange,
  required = false,
  placeholder,
  id,
}: CountrySelectProps) {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const countries = useMemo(() => getWorldCountries(lang), [lang]);
  const selected = findWorldCountry(value, lang);
  const resolvedPlaceholder = placeholder || t('countrySelect.placeholder');

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 20);
    } else {
      setQuery('');
    }
  }, [open]);

  const filteredCountries = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (!q) return countries;
    return countries.filter((c) => {
      const normName = c.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return normName.includes(q) || c.code.toLowerCase().includes(q);
    });
  }, [query, countries]);

  return (
    <div ref={containerRef} className="relative">
      {required && (
        <input
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="sr-only"
        />
      )}

      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none flex items-center justify-between gap-2 text-left"
      >
        <span className={selected ? 'text-[#141413] flex items-center gap-2 truncate' : 'text-[#8A877E] truncate'}>
          {selected ? (
            <>
              <span className="text-base leading-none shrink-0" aria-hidden="true">
                {selected.flag}
              </span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            resolvedPlaceholder
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#6B6860] shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 z-40 bg-white border border-[#D9D6CF] rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#EFECE6] bg-[#FAF9F6]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8A877E] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('countrySelect.searchPlaceholder')}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('countrySelect.clearSearch')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A877E] hover:text-[#141413]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto py-1 divide-y divide-[#F6F5F1]"
          >
            {filteredCountries.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-[#6B6860]">
                {t('countrySelect.noResults', { query })}
              </li>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.code === value.toUpperCase();
                return (
                  <li key={country.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(country.code);
                        setOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 hover:bg-[#FAF9F6] transition-colors ${
                        isSelected ? 'bg-[#2A4036]/8 font-semibold text-[#141413]' : 'text-[#3F3E3A]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base leading-none shrink-0" aria-hidden="true">
                          {country.flag}
                        </span>
                        <span className="truncate">{country.name}</span>
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#2A4036] shrink-0" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
