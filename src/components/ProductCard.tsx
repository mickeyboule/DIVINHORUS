import { formatPrice, getAvailabilityLabel } from '../lib/format';
import type { Category, Product } from '../types/cms';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  category?: Category;
  currencySymbol: string;
  onOpenProduct: (slug: string) => void;
  onOrderProduct: (product: Product) => void;
}

export function ProductCard({
  product,
  category,
  currencySymbol,
  onOpenProduct,
  onOrderProduct,
}: ProductCardProps) {
  const avail = getAvailabilityLabel(product.availability);
  const unavailable = product.availability === 'Rupture';

  return (
    <article className="group bg-white border border-[#E6E4DF] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpenProduct(product.slug)}
        className="block w-full aspect-[4/3] bg-[#F3F2EE] overflow-hidden text-left"
      >
        <SafeImage
          src={product.images[0]}
          alt={product.name}
          fallbackLabel={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 text-xs text-[#6B6860]">
          <span className="truncate">{category?.name || 'Création'}</span>
          <span className={`shrink-0 font-medium ${avail.textClass}`}>{avail.label}</span>
        </div>

        <button
          type="button"
          onClick={() => onOpenProduct(product.slug)}
          className="mt-1.5 text-left"
        >
          <h3 className="text-base font-semibold text-[#141413] leading-snug group-hover:text-[#2A4036] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </button>

        <p className="mt-2 text-sm text-[#5C5A55] leading-relaxed line-clamp-2 flex-1">
          {product.description}
        </p>

        <div className="mt-5 pt-4 border-t border-[#F0EFEA] flex items-center justify-between gap-3">
          <span className="text-[15px] font-mono font-medium tabular-nums text-[#141413]">
            {formatPrice(product.price, currencySymbol)}
          </span>
          <button
            type="button"
            disabled={unavailable}
            onClick={() => onOrderProduct(product)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2A4036] rounded-lg hover:bg-[#20322A] disabled:bg-stone-300 disabled:text-stone-600 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
          >
            {unavailable ? 'Indisponible' : 'Commander'}
          </button>
        </div>
      </div>
    </article>
  );
}
