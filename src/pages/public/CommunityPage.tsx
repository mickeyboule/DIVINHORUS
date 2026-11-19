import { ArrowRight, Heart, MessageSquarePlus, Play, Search, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SafeImage } from '../../components/SafeImage';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDateFr } from '../../lib/format';
import type { PublicBootstrapData, VideoItem } from '../../types/cms';

interface CommunityPageProps {
  data: PublicBootstrapData;
  actorKey: string;
  initialTab?: 'all' | 'articles' | 'videos' | 'testimonials';
  onNavigate: (path: string) => void;
  onPlayVideo: (video: VideoItem) => void;
  onToggleArticleLike: (articleId: string) => void;
  onOpenTestimonialModal: () => void;
}

export function CommunityPage({
  data,
  actorKey,
  initialTab = 'all',
  onNavigate,
  onPlayVideo,
  onToggleArticleLike,
  onOpenTestimonialModal,
}: CommunityPageProps) {
  const { lang, t } = useLanguage();
  const { articles, articleCategories, videos, testimonials } = data;
  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'videos' | 'testimonials'>(
    initialTab,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (selectedCategoryId !== 'all' && a.categoryId !== selectedCategoryId) return false;
      if (q) {
        const hay = `${a.title} ${a.excerpt} ${a.author}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, selectedCategoryId, search]);

  const filteredVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((v) => {
      if (!q) return true;
      return `${v.title} ${v.description}`.toLowerCase().includes(q);
    });
  }, [videos, search]);

  return (
    <div className="bg-[#FAF9F6] min-h-[75vh] py-12 sm:py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#2A4036] tracking-wide">
            {t('community.kicker')}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#141413] tracking-tight">
            {t('community.title')}
          </h1>
          <p className="mt-3 text-base text-[#5C5A55] leading-relaxed">
            {t('community.subtitle')}
          </p>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="mt-10 pb-6 border-b border-[#E6E4DF] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EFECE6] rounded-lg self-start">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'all' ? 'bg-white text-[#141413] shadow-xs' : 'text-[#5C5A55] hover:text-[#141413]'
              }`}
            >
              {t('community.tabAll')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('articles')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'articles' ? 'bg-white text-[#141413] shadow-xs' : 'text-[#5C5A55] hover:text-[#141413]'
              }`}
            >
              {t('community.tabArticles', { count: articles.length })}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'videos' ? 'bg-white text-[#141413] shadow-xs' : 'text-[#5C5A55] hover:text-[#141413]'
              }`}
            >
              {t('community.tabVideos', { count: videos.length })}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('testimonials')}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'testimonials'
                  ? 'bg-white text-[#141413] shadow-xs'
                  : 'text-[#5C5A55] hover:text-[#141413]'
              }`}
            >
              {t('community.tabTestimonials', { count: testimonials.length })}
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#8A877E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('community.searchPlaceholder')}
              className="w-full md:w-72 pl-9 pr-3 py-2 text-sm bg-white border border-[#E6E4DF] rounded-lg focus:border-[#2A4036] focus:outline-none"
            />
          </div>
        </div>

        {/* Articles Section */}
        {(activeTab === 'all' || activeTab === 'articles') && (
          <section className="mt-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-3xl font-semibold text-[#141413]">
                {t('community.articlesHeading')}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedCategoryId === 'all'
                      ? 'bg-[#2A4036] text-white'
                      : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
                  }`}
                >
                  {t('community.allTopics')}
                </button>
                {articleCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectedCategoryId === cat.id
                        ? 'bg-[#2A4036] text-white'
                        : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="bg-white border border-[#E6E4DF] rounded-xl p-10 text-center">
                <p className="text-sm text-[#5C5A55]">{t('community.noArticles')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                {filteredArticles.map((article) => {
                  const cat = articleCategories.find((c) => c.id === article.categoryId);
                  const isLiked = article.likedByKeys?.includes(actorKey);
                  return (
                    <article
                      key={article.id}
                      className="group bg-white border border-[#E6E4DF] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
                          <span>{cat?.name || t('community.teachingFallback')}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatDateFr(article.publishedAt, lang)}</span>
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
                        <div className="mt-5 pt-3 border-t border-[#F0EFEA] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onNavigate(`/communaute/${article.slug}`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A4036] hover:underline shrink-0"
                          >
                            <span>{t('community.read')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleArticleLike(article.id)}
                            aria-label={t('home.likeArticleAria', { title: article.title })}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                              isLiked
                                ? 'text-[#8A2E2E] bg-red-50'
                                : 'text-[#5C5A55] hover:text-[#141413] hover:bg-[#F3F2EE]'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="font-mono tabular-nums">{article.likesCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Videos Section */}
        {(activeTab === 'all' || activeTab === 'videos') && (
          <section className={activeTab === 'all' ? 'mt-16 pt-12 border-t border-[#E6E4DF]' : 'mt-10'}>
            <div className="mb-6">
              <h2 className="font-display text-3xl font-semibold text-[#141413]">
                {t('community.videosHeading')}
              </h2>
              <p className="mt-1.5 text-sm text-[#5C5A55]">{t('community.videosSubtitle')}</p>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="bg-white border border-[#E6E4DF] rounded-xl p-10 text-center">
                <p className="text-sm text-[#5C5A55]">{t('community.noVideos')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredVideos.map((video) => (
                  <article
                    key={video.id}
                    className="bg-white border border-[#E6E4DF] rounded-xl overflow-hidden flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => onPlayVideo(video)}
                      className="group relative block w-full aspect-video bg-[#141413] overflow-hidden"
                    >
                      <SafeImage
                        src={video.thumbnail}
                        alt={video.title}
                        fallbackLabel={video.title}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent flex items-center justify-center">
                        <span className="w-12 h-12 rounded-full bg-white/95 text-[#141413] flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105">
                          <Play className="w-4 h-4 ml-0.5 fill-current" />
                        </span>
                      </div>
                      {video.duration && (
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 text-white text-[11px] font-mono tabular-nums">
                          {video.duration}
                        </span>
                      )}
                    </button>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-[#141413] leading-snug">
                          {video.title}
                        </h3>
                        <p className="mt-2 text-sm text-[#5C5A55] leading-relaxed line-clamp-3">
                          {video.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#F0EFEA]">
                        <button
                          type="button"
                          onClick={() => onPlayVideo(video)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A4036] hover:underline"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{t('community.playVideo')}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Testimonials Section */}
        {(activeTab === 'all' || activeTab === 'testimonials') && (
          <section
            className={activeTab === 'all' ? 'mt-16 pt-12 border-t border-[#E6E4DF]' : 'mt-10'}
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-3xl font-semibold text-[#141413]">
                  {t('community.testimonialsHeading')}
                </h2>
                <p className="mt-1.5 text-sm text-[#5C5A55]">
                  {t('community.testimonialsSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenTestimonialModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2A4036] hover:bg-[#20322A] text-white text-xs font-semibold rounded-lg self-start sm:self-auto transition-colors whitespace-nowrap"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>{t('community.leaveTestimonial')}</span>
              </button>
            </div>

            {testimonials.length === 0 ? (
              <div className="bg-white border border-[#E6E4DF] rounded-xl p-10 text-center">
                <p className="text-sm text-[#5C5A55]">{t('community.noTestimonials')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white border border-[#E6E4DF] rounded-xl p-6 flex flex-col justify-between"
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
                        {lang === 'en' ? `"${item.content}"` : `« ${item.content} »`}
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-[#F0EFEA]">
                      <p className="text-sm font-semibold text-[#141413]">{item.authorName}</p>
                      <p className="text-xs text-[#6B6860] mt-0.5">
                        {item.authorLocation || t('community.visitorFallback')}
                        <span aria-hidden="true"> · </span>
                        {formatDateFr(item.createdAt, lang)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
