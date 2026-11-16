import { ArrowRight, Heart, MessageSquarePlus, Play, Star } from 'lucide-react';
import { formatDateFr } from '../../lib/format';
import type { Product, PublicBootstrapData, VideoItem } from '../../types/cms';
import { ProductCard } from '../../components/ProductCard';
import { SafeImage } from '../../components/SafeImage';

interface HomePageProps {
  data: PublicBootstrapData;
  actorKey: string;
  onNavigate: (path: string) => void;
  onOrderProduct: (product: Product) => void;
  onPlayVideo: (video: VideoItem) => void;
  onToggleArticleLike: (articleId: string) => void;
  onOpenTestimonialModal: () => void;
}

export function HomePage({
  data,
  actorKey,
  onNavigate,
  onOrderProduct,
  onPlayVideo,
  onToggleArticleLike,
  onOpenTestimonialModal,
}: HomePageProps) {
  const { siteContent, settings, products, categories, articles, articleCategories, videos, testimonials } = data;
  const { hero, master, homeSections } = siteContent;

  const featuredProducts = homeSections.featuredProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
  const displayProducts =
    featuredProducts.length > 0 ? featuredProducts : products.filter((p) => p.featured).slice(0, 4);

  const featuredArticles = homeSections.featuredArticleIds
    .map((id) => articles.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const displayArticles = featuredArticles.length > 0 ? featuredArticles : articles.slice(0, 3);

  const featuredVideos = homeSections.featuredVideoIds
    .map((id) => videos.find((v) => v.id === id))
    .filter((v): v is VideoItem => Boolean(v));
  const displayVideos = featuredVideos.length > 0 ? featuredVideos : videos.slice(0, 2);

  const featuredTestimonials = testimonials.filter((t) => t.featured);
  const displayTestimonials =
    (featuredTestimonials.length > 0 ? featuredTestimonials : testimonials).slice(0, 3);

  const renderSection = (key: 'master' | 'products' | 'articles' | 'videos' | 'testimonials') => {
    if (key === 'master' && master.visible) {
      return (
        <section key="master" className="py-16 sm:py-24 border-b border-[#E6E4DF] bg-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
              <div className="lg:col-span-5">
                <div className="aspect-[3/4] lg:aspect-auto lg:h-full min-h-[380px] rounded-xl overflow-hidden bg-[#F3F2EE]">
                  <SafeImage
                    src={master.photo}
                    alt={master.name}
                    fallbackLabel={master.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-7 flex flex-col justify-center py-2">
                <p className="text-xs font-medium tracking-wide text-[#2A4036]">
                  {master.title}
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-5xl font-semibold text-[#141413] tracking-tight">
                  {master.name}
                </h2>
                <p className="mt-6 text-base text-[#3F3E3A] leading-relaxed">
                  {master.shortBio}
                </p>
                <p className="mt-4 text-base text-[#5C5A55] leading-relaxed">
                  {master.approach}
                </p>
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => onNavigate('/a-propos')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#141413] border border-[#D4D0C8] rounded-lg hover:border-[#141413] hover:bg-[#FAF9F6] transition-colors"
                  >
                    <span>{master.buttonLabel || 'En savoir plus'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (key === 'products' && homeSections.showFeaturedProducts && displayProducts.length > 0) {
      return (
        <section key="products" className="py-16 sm:py-24 bg-[#FAF9F6] border-b border-[#E6E4DF]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#141413] tracking-tight">
                  {homeSections.featuredProductsTitle}
                </h2>
                <p className="mt-2.5 text-sm sm:text-base text-[#5C5A55] leading-relaxed">
                  {homeSections.featuredProductsSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/boutique')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2A4036] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Voir toute la boutique</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProducts.map((product) => (
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
          </div>
        </section>
      );
    }

    if (key === 'articles' && homeSections.showCommunityArticles && displayArticles.length > 0) {
      return (
        <section key="articles" className="py-16 sm:py-24 bg-white border-b border-[#E6E4DF]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#141413] tracking-tight">
                  {homeSections.featuredArticlesTitle}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#5C5A55]">
                  Réflexions et textes publiés régulièrement pour nourrir votre cheminement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/communaute')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2A4036] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Voir toute la communauté</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {displayArticles.map((article) => {
                const cat = articleCategories.find((c) => c.id === article.categoryId);
                const isLiked = article.likedByKeys?.includes(actorKey);
                return (
                  <article
                    key={article.id}
                    className="group bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => onNavigate(`/communaute/${article.slug}`)}
                      className="block w-full aspect-[4/3] bg-[#F3F2EE] overflow-hidden"
                    >
                      <SafeImage
                        src={article.image}
                        alt={article.title}
                        fallbackLabel={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </button>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-[#6B6860]">
                        <span>{cat?.name || 'Enseignement'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDateFr(article.publishedAt)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/communaute/${article.slug}`)}
                        className="mt-2 text-left"
                      >
                        <h3 className="font-display text-2xl font-semibold text-[#141413] leading-snug group-hover:text-[#2A4036] transition-colors">
                          {article.title}
                        </h3>
                      </button>
                      <p className="mt-2.5 text-sm text-[#5C5A55] leading-relaxed line-clamp-3 flex-1">
                        {article.excerpt}
                      </p>
                      <div className="mt-5 pt-3 border-t border-[#E6E4DF] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigate(`/communaute/${article.slug}`)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A4036] hover:underline"
                        >
                          <span>Lire l’article</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleArticleLike(article.id)}
                          aria-label={`Aimer ${article.title}`}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                            isLiked
                              ? 'text-[#8A2E2E] bg-red-50'
                              : 'text-[#5C5A55] hover:text-[#141413] hover:bg-[#EFECE6]'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`}
                          />
                          <span className="font-mono tabular-nums">{article.likesCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (key === 'videos' && homeSections.showCommunityVideos && displayVideos.length > 0) {
      return (
        <section key="videos" className="py-16 sm:py-24 bg-[#F3F2EE]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#141413] tracking-tight">
                  {homeSections.featuredVideosTitle}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#5C5A55]">
                  Entretiens filmés et séances de méditation accessibles directement depuis le site.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/communaute?tab=videos')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2A4036] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Toutes les vidéos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {displayVideos.map((video) => (
                <article
                  key={video.id}
                  className="bg-white border border-[#E6E4DF] rounded-xl overflow-hidden flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => onPlayVideo(video)}
                    className="group relative block w-full aspect-video bg-[#141413] overflow-hidden text-left"
                  >
                    <SafeImage
                      src={video.thumbnail}
                      alt={video.title}
                      fallbackLabel={video.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center">
                      <span className="w-14 h-14 rounded-full bg-white/95 text-[#141413] flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </span>
                    </div>
                    {video.duration && (
                      <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/75 text-white text-xs font-mono tabular-nums">
                        {video.duration}
                      </span>
                    )}
                  </button>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#141413] leading-snug">
                        {video.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#5C5A55] leading-relaxed">
                        {video.description}
                      </p>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => onPlayVideo(video)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A4036] hover:underline"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Lire la vidéo</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (key === 'testimonials' && homeSections.showTestimonials) {
      return (
        <section key="testimonials" className="py-16 sm:py-24 bg-white border-t border-[#E6E4DF]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#141413] tracking-tight">
                  {homeSections.featuredTestimonialsTitle || 'Paroles & Témoignages'}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#5C5A55]">
                  Retours d’expérience partagés par celles et ceux qui suivent les enseignements ou reçoivent nos objets.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onOpenTestimonialModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2A4036] hover:bg-[#20322A] rounded-lg transition-colors whitespace-nowrap"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Laisser un témoignage</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/communaute?tab=testimonials')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2A4036] hover:underline whitespace-nowrap"
                >
                  <span>Tous les avis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {displayTestimonials.length === 0 ? (
              <div className="bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl p-10 text-center text-sm text-[#5C5A55]">
                Soyez la première personne à partager votre témoignage.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displayTestimonials.map((item) => (
                  <article
                    key={item.id}
                    className="bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.rating ? 'fill-[#8A6D3B] text-[#8A6D3B]' : 'text-[#D4D0C8]'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-[#2B2A27] leading-relaxed">
                        « {item.content} »
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-[#E6E4DF]">
                      <p className="text-sm font-semibold text-[#141413]">{item.authorName}</p>
                      <p className="text-xs text-[#6B6860] mt-0.5">
                        {item.authorLocation || 'Membre de la communauté'}
                        <span aria-hidden="true"> · </span>
                        {formatDateFr(item.createdAt)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div>
      {/* Hero Section */}
      {hero.visible && (
        <section className="relative bg-[#181917] text-white overflow-hidden">
          <div className="absolute inset-0">
            <SafeImage
              src={hero.image}
              alt={hero.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141413]/85 via-[#141413]/60 to-[#141413]/25" />
          </div>

          <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-8 py-24 sm:py-32 lg:py-40">
            <div className="max-w-2xl">
              <p className="text-xs sm:text-sm font-medium text-stone-200 tracking-wide">
                {settings.general.siteName} · {settings.general.tagline}
              </p>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight text-white">
                {hero.title}
              </h1>
              <p className="mt-6 text-base sm:text-lg text-stone-200 leading-relaxed max-w-xl">
                {hero.subtitle}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate(hero.primaryButtonTarget || '/boutique')}
                  className="px-6 py-3 bg-[#2A4036] hover:bg-[#20322A] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  {hero.primaryButtonLabel || 'Découvrir la boutique'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(hero.secondaryButtonTarget || '/communaute')}
                  className="px-6 py-3 bg-white/12 hover:bg-white/20 backdrop-blur-xs text-white border border-white/25 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  {hero.secondaryButtonLabel || 'Rejoindre la communauté'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic CMS-ordered Sections */}
      {homeSections.sectionOrder.map((sec) => renderSection(sec))}
    </div>
  );
}
