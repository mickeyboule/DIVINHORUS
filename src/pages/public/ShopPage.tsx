import { Globe, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProductCard } from '../../components/ProductCard';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Product, PublicBootstrapData } from '../../types/cms';

interface ShopPageProps {
  data: PublicBootstrapData;
  initialCategorySlug?: string;
  onNavigate: (path: string) => void;
  onOrderProduct: (product: Product) => void;
}

export function ShopPage({
  data,
  initialCategorySlug,
  onNavigate,
  onOrderProduct,
}: ShopPageProps) {
  const { t } = useLanguage();
  const { categories, products, settings } = data;
  const { countryOption, autoEnabled, availableCountries, setCountryOverride } = useCurrency();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (!initialCategorySlug) return 'all';
    const found = categories.find((c) => c.slug === initialCategorySlug);
    return found ? found.id : 'all';
  });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
      if (q) {
        const hay = `${p.name} ${p.description} ${p.reference}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [products, selectedCategoryId, search, sortBy]);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="bg-[#FAF9F6] min-h-[75vh] py-12 sm:py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        {/* Page Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#2A4036] tracking-wide">{t('shop.kicker')}</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#141413] tracking-tight">
            {activeCategory ? activeCategory.name : t('shop.allProductsTitle')}
          </h1>
          <p className="mt-3 text-base text-[#5C5A55] leading-relaxed">
            {activeCategory ? activeCategory.description : t('shop.allProductsSubtitle')}
          </p>
        </div>

        {/* Dynamic Category Filters + Search + Sort */}
        <div className="mt-10 pb-6 border-b border-[#E6E4DF] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label={t('shop.categoriesAria')}
          >
            <button
              type="button"
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategoryId === 'all'
                  ? 'bg-[#2A4036] text-white'
                  : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
              }`}
            >
              {t('shop.allProductsTab', { count: products.length })}
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategoryId === cat.id
                      ? 'bg-[#2A4036] text-white'
                      : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8A877E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('shop.searchPlaceholder')}
                className="w-full sm:w-60 pl-9 pr-3 py-2 text-sm bg-white border border-[#E6E4DF] rounded-lg focus:border-[#2A4036] focus:outline-none"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
              aria-label={t('shop.sortAria')}
              className="px-3 py-2 text-sm bg-white border border-[#E6E4DF] rounded-lg text-[#141413] focus:border-[#2A4036] focus:outline-none"
            >
              <option value="featured">{t('shop.sortFeatured')}</option>
              <option value="price-asc">{t('shop.sortPriceAsc')}</option>
              <option value="price-desc">{t('shop.sortPriceDesc')}</option>
            </select>

            {autoEnabled && (
              <div className="relative flex items-center bg-white border border-[#E6E4DF] rounded-lg px-2.5 py-2 focus-within:border-[#2A4036]">
                <Globe className="w-4 h-4 text-[#2A4036] shrink-0 mr-2" />
                <label htmlFor="shop-country-currency" className="sr-only">
                  {t('shop.countryCurrencyAria')}
                </label>
                <select
                  id="shop-country-currency"
                  value={countryOption.countryCode}
                  onChange={(e) => setCountryOverride(e.target.value)}
                  className="text-sm bg-transparent text-[#141413] focus:outline-none pr-1"
                >
                  {availableCountries.map((opt) => (
                    <option key={opt.countryCode} value={opt.countryCode}>
                      {opt.countryName} ({opt.currencySymbol})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#E6E4DF] rounded-xl mt-8 px-6">
            <p className="font-display text-2xl font-semibold text-[#141413]">
              {t('shop.emptyTitle')}
            </p>
            <p className="mt-2 text-sm text-[#5C5A55]">{t('shop.emptyDesc')}</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('all');
                setSearch('');
              }}
              className="mt-5 px-4 py-2 text-xs font-semibold bg-[#2A4036] text-white rounded-lg hover:bg-[#20322A]"
            >
              {t('shop.resetFilters')}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                category={categories.find((c) => c.id === product.categoryId)}
                currencySymbol={settings.general.currencySymbol}
                onOpenProduct={(slug) => onNavigate(`/boutique/${slug}`)}
                onOrderProduct={onOrderProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
