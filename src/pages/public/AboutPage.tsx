import { ChevronDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SafeImage } from '../../components/SafeImage';
import { useLanguage } from '../../contexts/LanguageContext';
import { translateFaqCategory } from '../../lib/i18n';
import type { FaqCategory, PublicBootstrapData } from '../../types/cms';

interface AboutPageProps {
  data: PublicBootstrapData;
  onNavigate: (path: string) => void;
}

type FaqFilter = 'Toutes' | FaqCategory;

export function AboutPage({ data, onNavigate }: AboutPageProps) {
  const { lang, t } = useLanguage();
  const { aboutPage, master } = data.siteContent;
  const visibleFaqs = useMemo(
    () => (aboutPage.faqs || []).filter((item) => item.visible !== false),
    [aboutPage.faqs],
  );

  const [selectedCategory, setSelectedCategory] = useState<FaqFilter>('Toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<string[]>(() =>
    visibleFaqs.length > 0 ? [visibleFaqs[0].id] : [],
  );

  const availableCategories = useMemo<FaqFilter[]>(() => {
    const order: FaqCategory[] = ['Enseignements', 'Boutique', 'Général'];
    const present = order.filter((cat) => visibleFaqs.some((f) => f.category === cat));
    return ['Toutes', ...present];
  }, [visibleFaqs]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleFaqs.filter((item) => {
      if (selectedCategory !== 'Toutes' && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        translateFaqCategory(item.category, lang).toLowerCase().includes(q)
      );
    });
  }, [visibleFaqs, selectedCategory, searchQuery, lang]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const allFilteredOpen =
    filteredFaqs.length > 0 && filteredFaqs.every((item) => openIds.includes(item.id));

  const toggleAllFiltered = () => {
    if (allFilteredOpen) {
      const filteredSet = new Set(filteredFaqs.map((f) => f.id));
      setOpenIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      setOpenIds((prev) => Array.from(new Set([...prev, ...filteredFaqs.map((f) => f.id)])));
    }
  };

  const countForCategory = (cat: FaqFilter) =>
    cat === 'Toutes'
      ? visibleFaqs.length
      : visibleFaqs.filter((f) => f.category === cat).length;

  const getCategoryLabel = (cat: FaqFilter) =>
    cat === 'Toutes' ? t('about.faqCatAll') : translateFaqCategory(cat, lang);

  return (
    <div className="bg-[#FAF9F6]">
      {/* Intro Hero */}
      <section className="py-16 sm:py-24 border-b border-[#E6E4DF] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-xs font-medium text-[#8F6B18] tracking-wide">
                {t('about.kicker', { siteName: data.settings.general.siteName })}
              </p>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold text-[#141413] leading-[1.12] tracking-tight [text-wrap:balance]">
                {aboutPage.heroTitle}
              </h1>
              <p className="mt-5 text-base sm:text-lg text-[#5C5A55] leading-relaxed max-w-2xl">
                {aboutPage.heroSubtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/boutique')}
                  className="px-5 py-2.5 bg-[#8F6B18] text-white text-sm font-semibold rounded-lg hover:bg-[#735613] transition-colors whitespace-nowrap shrink-0"
                >
                  {t('about.discoverCreations')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="px-5 py-2.5 bg-white border border-[#D9D6CF] text-[#141413] text-sm font-semibold rounded-lg hover:border-[#141413] transition-colors whitespace-nowrap shrink-0"
                >
                  {t('about.contactUs')}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[3/4] lg:aspect-auto lg:h-full min-h-[380px] rounded-xl overflow-hidden bg-[#F3F2EE]">
                <SafeImage
                  src={aboutPage.image || master.photo}
                  alt={master.name}
                  fallbackLabel={master.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy & Atelier */}
      <section className="py-16 sm:py-24 border-b border-[#E6E4DF]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-semibold text-[#141413] [text-wrap:balance]">
              {aboutPage.philosophyTitle}
            </h2>
            <div className="mt-4 space-y-4 text-base text-[#3F3E3A] leading-relaxed whitespace-pre-line max-w-prose">
              {aboutPage.philosophyBody}
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl font-semibold text-[#141413] [text-wrap:balance]">
              {aboutPage.lineageTitle}
            </h2>
            <div className="mt-4 space-y-4 text-base text-[#3F3E3A] leading-relaxed whitespace-pre-line max-w-prose">
              {aboutPage.lineageBody}
            </div>
          </div>
        </div>
      </section>

      {/* Commitments */}
      {aboutPage.commitments.length > 0 && (
        <section className="py-16 sm:py-24 bg-white border-b border-[#E6E4DF]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <h2 className="font-display text-3xl font-semibold text-[#141413] mb-10 [text-wrap:balance]">
              {t('about.commitmentsHeading')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {aboutPage.commitments.map((item, idx) => (
                <div key={idx} className="p-6 bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl">
                  <p className="text-xs font-mono tabular-nums text-[#6B6860] mb-2">0{idx + 1}.</p>
                  <h3 className="text-lg font-semibold text-[#141413]">{item.title}</h3>
                  <p className="mt-2.5 text-sm text-[#5C5A55] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic FAQ Section */}
      {visibleFaqs.length > 0 && (
        <section id="faq" className="py-16 sm:py-24 bg-[#FAF9F6]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Left Sticky Intro & Controls */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                <div>
                  <p className="text-xs font-medium text-[#8F6B18] tracking-wide">
                    {t('about.faqKicker')}
                  </p>
                  <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#141413] leading-tight [text-wrap:balance]">
                    {aboutPage.faqTitle || t('about.faqTitleDefault')}
                  </h2>
                  <p className="mt-3 text-sm text-[#5C5A55] leading-relaxed">
                    {aboutPage.faqSubtitle || t('about.faqSubtitleDefault')}
                  </p>
                </div>

                {/* Live Search */}
                <div>
                  <label htmlFor="faq-search" className="sr-only">
                    {t('about.faqSearchSr')}
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#6B6860] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="faq-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('about.faqSearchPlaceholder')}
                      className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-[#D9D6CF] rounded-lg text-[#141413] placeholder:text-[#8A877E] focus:outline-none focus:border-[#8F6B18]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label={t('countrySelect.clearSearch')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B6860] hover:text-[#141413]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#6B6860]">{t('about.faqFilterLabel')}</p>
                  <div
                    role="tablist"
                    aria-label={t('about.faqCategoriesAria')}
                    className="flex flex-wrap gap-1.5"
                  >
                    {availableCategories.map((cat) => {
                      const active = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-[#8F6B18] border-[#8F6B18] text-white'
                              : 'bg-white border-[#E6E4DF] text-[#5C5A55] hover:border-[#8F6B18] hover:text-[#141413]'
                          }`}
                        >
                          <span>{getCategoryLabel(cat)}</span>
                          <span
                            className={`ml-1.5 tabular-nums ${
                              active ? 'text-white/80' : 'text-[#8A877E]'
                            }`}
                          >
                            ({countForCategory(cat)})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Contact Fallback */}
                <div className="pt-4 border-t border-[#E6E4DF]">
                  <p className="text-xs text-[#5C5A55] leading-relaxed">
                    {t('about.faqNotFoundPrompt')}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('/contact')}
                    className="mt-2 text-xs font-semibold text-[#8F6B18] hover:underline whitespace-nowrap"
                  >
                    {t('about.faqWriteTo', { siteName: data.settings.general.siteName })}
                  </button>
                </div>
              </div>

              {/* Right Accordion List */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E6E4DF]">
                  <p className="text-xs text-[#6B6860] tabular-nums">
                    {filteredFaqs.length > 1
                      ? t('about.faqCountPlural', { count: filteredFaqs.length })
                      : t('about.faqCountSingle', { count: filteredFaqs.length })}
                  </p>
                  {filteredFaqs.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllFiltered}
                      className="text-xs font-medium text-[#8F6B18] hover:underline whitespace-nowrap shrink-0"
                    >
                      {allFilteredOpen ? t('about.faqCollapseAll') : t('about.faqExpandAll')}
                    </button>
                  )}
                </div>

                {filteredFaqs.length === 0 ? (
                  <div className="py-12 px-6 bg-white border border-[#E6E4DF] rounded-xl mt-6 text-center">
                    <p className="text-sm font-medium text-[#141413]">
                      {t('about.faqEmptyTitle')}
                    </p>
                    <p className="mt-1.5 text-xs text-[#5C5A55]">{t('about.faqEmptyDesc')}</p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('Toutes');
                        }}
                        className="px-4 py-2 text-xs font-semibold bg-[#8F6B18] text-white rounded-lg hover:bg-[#735613] transition-colors"
                      >
                        {t('about.faqResetFilters')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('/contact')}
                        className="px-4 py-2 text-xs font-semibold bg-white border border-[#D9D6CF] text-[#141413] rounded-lg hover:border-[#141413] transition-colors"
                      >
                        {t('about.faqAskQuestion')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E6E4DF] border-b border-[#E6E4DF]">
                    {filteredFaqs.map((item, idx) => {
                      const isOpen = openIds.includes(item.id);
                      const panelId = `faq-panel-${item.id}`;
                      const numberLabel = String(idx + 1).padStart(2, '0');
                      return (
                        <div key={item.id} className="py-5 sm:py-6">
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() => toggleItem(item.id)}
                            className="w-full text-left flex items-start justify-between gap-6 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F6B18] rounded-md"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-xs text-[#6B6860] mb-1.5">
                                <span className="font-mono tabular-nums">{numberLabel}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-[#8F6B18]">
                                  {translateFaqCategory(item.category, lang)}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg font-semibold text-[#141413] group-hover:text-[#8F6B18] transition-colors leading-snug">
                                {item.question}
                              </h3>
                            </div>
                            <span
                              className={`mt-2 w-8 h-8 rounded-lg border border-[#E6E4DF] bg-white flex items-center justify-center shrink-0 text-[#5C5A55] group-hover:border-[#8F6B18] group-hover:text-[#8F6B18] transition-all duration-200 ${
                                isOpen ? 'rotate-180 bg-[#EFECE6]' : ''
                              }`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </span>
                          </button>

                          {isOpen && (
                            <div
                              id={panelId}
                              className="mt-3.5 pr-12 text-sm sm:text-[15px] text-[#3F3E3A] leading-relaxed whitespace-pre-line max-w-prose"
                            >
                              {item.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
