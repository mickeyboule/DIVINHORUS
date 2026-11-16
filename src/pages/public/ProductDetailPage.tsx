import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { ProductCard } from '../../components/ProductCard';
import { SafeImage } from '../../components/SafeImage';
import { formatPrice, getAvailabilityLabel } from '../../lib/format';
import type { Product, PublicBootstrapData } from '../../types/cms';

interface ProductDetailPageProps {
  slug: string;
  data: PublicBootstrapData;
  onNavigate: (path: string) => void;
  onOrderProduct: (product: Product, qty: number) => void;
  onAddToBasket: (product: Product, qty: number) => void;
}

export function ProductDetailPage({
  slug,
  data,
  onNavigate,
  onOrderProduct,
  onAddToBasket,
}: ProductDetailPageProps) {
  const { products, categories, settings } = data;
  const product = products.find((p) => p.slug === slug);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-[#141413]">
          Produit introuvable
        </h1>
        <p className="mt-2 text-sm text-[#5C5A55]">
          Ce produit n’est plus disponible ou a été déplacé.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/boutique')}
          className="mt-6 px-5 py-2.5 bg-[#2A4036] text-white text-sm font-semibold rounded-lg"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const avail = getAvailabilityLabel(product.availability);
  const unavailable = product.availability === 'Rupture';
  const images = product.images.length > 0 ? product.images : [''];
  const activeImage = images[Math.min(selectedImageIdx, images.length - 1)];

  const related = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, 3);
  const fallbackRelated =
    related.length > 0
      ? related
      : products.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <div className="bg-[#FAF9F6] py-10 sm:py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        <button
          type="button"
          onClick={() => onNavigate('/boutique')}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#5C5A55] hover:text-[#141413] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la boutique</span>
        </button>

        {/* Contiguous Purchase Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Gallery Left */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/3] bg-white border border-[#E6E4DF] rounded-xl overflow-hidden">
              <SafeImage
                src={activeImage}
                alt={product.name}
                fallbackLabel={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`aspect-[4/3] rounded-lg overflow-hidden border transition-all ${
                      idx === selectedImageIdx
                        ? 'border-[#2A4036] ring-2 ring-[#2A4036]/20'
                        : 'border-[#E6E4DF] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <SafeImage
                      src={img}
                      alt={`${product.name} vue ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Purchase Details Right */}
          <div className="lg:col-span-5 bg-white border border-[#E6E4DF] rounded-xl p-6 sm:p-8 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-xs text-[#6B6860]">
              <span>{category?.name || 'Création'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Réf. {product.reference}</span>
            </div>

            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#141413] leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline justify-between gap-4 pb-5 border-b border-[#F0EFEA]">
              <span className="text-2xl font-mono font-semibold tabular-nums text-[#141413]">
                {formatPrice(product.price, settings.general.currencySymbol)}
              </span>
              <span className={`text-xs font-semibold ${avail.textClass}`}>{avail.label}</span>
            </div>

            <p className="mt-5 text-sm sm:text-base text-[#3F3E3A] leading-relaxed">
              {product.description}
            </p>

            {product.additionalInfo && (
              <div className="mt-5 pt-4 border-t border-[#F0EFEA]">
                <h2 className="text-xs font-semibold text-[#141413] mb-1.5">
                  Informations complémentaires
                </h2>
                <p className="text-xs sm:text-sm text-[#5C5A55] leading-relaxed">
                  {product.additionalInfo}
                </p>
              </div>
            )}

            {/* Quantity & Order CTAs */}
            <div className="mt-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#5C5A55]">Quantité souhaitée</span>
                <div className="inline-flex items-center border border-[#D9D6CF] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Diminuer la quantité"
                    className="w-9 h-9 flex items-center justify-center text-[#5C5A55] hover:text-[#141413]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-mono font-medium tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    aria-label="Augmenter la quantité"
                    className="w-9 h-9 flex items-center justify-center text-[#5C5A55] hover:text-[#141413]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={unavailable}
                onClick={() => onOrderProduct(product, qty)}
                className="w-full py-3.5 px-5 bg-[#2A4036] hover:bg-[#20322A] disabled:bg-stone-300 disabled:text-stone-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {unavailable ? 'Momentanément indisponible' : 'Commander'}
              </button>

              {settings.orderSettings.allowMultiProductCart && !unavailable && (
                <button
                  type="button"
                  onClick={() => onAddToBasket(product, qty)}
                  className="w-full py-2.5 px-4 bg-[#FAF9F6] hover:bg-[#EFECE6] border border-[#D9D6CF] text-[#141413] text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ajouter à ma sélection et continuer</span>
                </button>
              )}

              <p className="text-[11px] text-[#6B6860] text-center pt-1">
                Aucun paiement en ligne. Confirmation et modalités de remise par notre équipe.
              </p>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {fallbackRelated.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#E6E4DF]">
            <h2 className="font-display text-3xl font-semibold text-[#141413] mb-8">
              Produits similaires
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {fallbackRelated.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  category={categories.find((c) => c.id === item.categoryId)}
                  currencySymbol={settings.general.currencySymbol}
                  onOpenProduct={(s) => {
                    setSelectedImageIdx(0);
                    setQty(1);
                    onNavigate(`/boutique/${s}`);
                  }}
                  onOrderProduct={(p) => onOrderProduct(p, 1)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
