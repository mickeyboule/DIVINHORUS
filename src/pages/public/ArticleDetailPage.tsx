import { ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { SafeImage } from '../../components/SafeImage';
import { formatDateFr } from '../../lib/format';
import type { PublicBootstrapData } from '../../types/cms';

interface ArticleDetailPageProps {
  slug: string;
  data: PublicBootstrapData;
  actorKey: string;
  onNavigate: (path: string) => void;
  onToggleArticleLike: (articleId: string) => void;
}

export function ArticleDetailPage({
  slug,
  data,
  actorKey,
  onNavigate,
  onToggleArticleLike,
}: ArticleDetailPageProps) {
  const { articles, articleCategories } = data;
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold text-[#141413]">
          Article introuvable
        </h1>
        <p className="mt-2 text-sm text-[#5C5A55]">
          Cet article n’est pas disponible ou a été dépublié.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/communaute')}
          className="mt-6 px-5 py-2.5 bg-[#2A4036] text-white text-sm font-semibold rounded-lg"
        >
          Retour à la communauté
        </button>
      </div>
    );
  }

  const category = articleCategories.find((c) => c.id === article.categoryId);
  const paragraphs = article.content.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const similarArticles = articles
    .filter((a) => a.id !== article.id)
    .sort((a, b) => Number(b.categoryId === article.categoryId) - Number(a.categoryId === article.categoryId))
    .slice(0, 3);

  return (
    <article className="bg-[#FAF9F6] py-10 sm:py-16">
      <div className="max-w-[820px] mx-auto px-4 sm:px-8">
        <button
          type="button"
          onClick={() => onNavigate('/communaute')}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#5C5A55] hover:text-[#141413] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la communauté</span>
        </button>

        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6860]">
            <span className="font-medium text-[#2A4036]">{category?.name || 'Enseignement'}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDateFr(article.publishedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>Par {article.author}</span>
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-5xl font-semibold text-[#141413] leading-[1.12] tracking-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-5 text-lg text-[#5C5A55] leading-relaxed">
              {article.excerpt}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleArticleLike(article.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                article.likedByKeys?.includes(actorKey)
                  ? 'bg-red-50 border-red-200 text-[#8A2E2E]'
                  : 'bg-white border-[#D9D6CF] text-[#3F3E3A] hover:border-[#141413]'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${article.likedByKeys?.includes(actorKey) ? 'fill-current' : ''}`}
              />
              <span>
                {article.likedByKeys?.includes(actorKey)
                  ? 'Vous aimez cet enseignement'
                  : 'J’aime cet enseignement'}
              </span>
              <span className="font-mono tabular-nums pl-1 border-l border-current/20">
                {article.likesCount || 0}
              </span>
            </button>
          </div>
        </header>

        {article.image && (
          <div className="mt-8 aspect-[16/10] rounded-xl overflow-hidden bg-[#F3F2EE] border border-[#E6E4DF]">
            <SafeImage
              src={article.image}
              alt={article.title}
              fallbackLabel={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mt-10 space-y-6 text-base sm:text-[17px] text-[#2B2A27] leading-[1.78]">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[#E6E4DF] flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onToggleArticleLike(article.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg border transition-colors ${
              article.likedByKeys?.includes(actorKey)
                ? 'bg-red-50 border-red-200 text-[#8A2E2E]'
                : 'bg-white border-[#D9D6CF] text-[#3F3E3A] hover:border-[#141413]'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${article.likedByKeys?.includes(actorKey) ? 'fill-current' : ''}`}
            />
            <span>
              {article.likedByKeys?.includes(actorKey) ? 'Aimé' : 'Aimer cet article'} (
              <span className="font-mono tabular-nums">{article.likesCount || 0}</span>)
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/communaute')}
            className="text-xs font-semibold text-[#2A4036] hover:underline"
          >
            Retour aux enseignements
          </button>
        </div>
      </div>

      {/* Similar Articles */}
      {similarArticles.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 sm:px-8 mt-20 pt-12 border-t border-[#E6E4DF]">
          <h2 className="font-display text-3xl font-semibold text-[#141413] mb-8">
            Articles similaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {similarArticles.map((item) => {
              const cat = articleCategories.find((c) => c.id === item.categoryId);
              return (
                <article
                  key={item.id}
                  className="bg-white border border-[#E6E4DF] rounded-xl overflow-hidden flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(`/communaute/${item.slug}`)}
                    className="block w-full aspect-[4/3] bg-[#F3F2EE] overflow-hidden"
                  >
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-[#6B6860]">
                      <span>{cat?.name || 'Enseignement'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDateFr(item.publishedAt)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate(`/communaute/${item.slug}`)}
                      className="mt-2 text-left"
                    >
                      <h3 className="font-display text-xl font-semibold text-[#141413] hover:text-[#2A4036]">
                        {item.title}
                      </h3>
                    </button>
                    <div className="mt-4 pt-3 border-t border-[#F0EFEA]">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/communaute/${item.slug}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A4036] hover:underline"
                      >
                        <span>Lire l’article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
