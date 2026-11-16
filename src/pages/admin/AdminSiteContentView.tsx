import { ArrowDown, ArrowUp, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { SafeImage } from '../../components/SafeImage';
import { adminApi } from '../../lib/api';
import type { Article, MediaItem, Product, SiteContent, VideoItem } from '../../types/cms';

interface AdminSiteContentViewProps {
  siteContent: SiteContent;
  products: Product[];
  articles: Article[];
  videos: VideoItem[];
  media: MediaItem[];
  onSiteContentChanged: (content: SiteContent) => void;
  onMediaAdded: (item: MediaItem) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

type SectionKey = 'master' | 'products' | 'articles' | 'videos' | 'testimonials';

const SECTION_NAMES: Record<SectionKey, string> = {
  master: 'Présentation du Maître',
  products: 'Sélection de produits (Boutique)',
  articles: 'Derniers articles (Communauté)',
  videos: 'Dernières vidéos YouTube',
  testimonials: 'Témoignages de la communauté',
};

export function AdminSiteContentView({
  siteContent,
  products,
  articles,
  videos,
  media,
  onSiteContentChanged,
  onMediaAdded,
  onNotify,
}: AdminSiteContentViewProps) {
  const [draft, setDraft] = useState<SiteContent>(siteContent);
  const [tab, setTab] = useState<'hero' | 'master' | 'home' | 'about' | 'contact'>('hero');
  const [pickerTarget, setPickerTarget] = useState<'hero' | 'master' | 'about' | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.updateSiteContent(draft);
      onSiteContentChanged(res.siteContent);
      onNotify('success', 'Contenu du site mis à jour et publié.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const toggleInList = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const moveHomeSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    const order = [...draft.homeSections.sectionOrder];
    if (target < 0 || target >= order.length) return;
    const [moved] = order.splice(idx, 1);
    order.splice(target, 0, moved);
    setDraft({
      ...draft,
      homeSections: { ...draft.homeSections, sectionOrder: order },
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Contenu du site &amp; Accueil</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Modifiez textes, images, sections visibles et sélections de la page d’accueil sans toucher au code.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2A4036] hover:bg-[#20322A] disabled:opacity-50 text-white text-xs font-semibold rounded-lg self-start"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement...' : 'Publier les modifications'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'hero', label: 'Hero d’accueil' },
          { id: 'master', label: 'Présentation du Maître' },
          { id: 'home', label: 'Sections & Sélections Accueil' },
          { id: 'about', label: 'Page À propos' },
          { id: 'contact', label: 'Page Contact' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg ${
              tab === t.id
                ? 'bg-[#141413] text-white'
                : 'bg-white border border-[#E3E3E6] text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* HERO TAB */}
      {tab === 'hero' && (
        <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-5 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.hero.visible}
              onChange={(e) =>
                setDraft({ ...draft, hero: { ...draft.hero, visible: e.target.checked } })
              }
            />
            <span className="font-semibold text-[#141413]">Afficher la bannière Hero sur l’accueil</span>
          </label>

          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Titre principal</label>
            <input
              type="text"
              value={draft.hero.title}
              onChange={(e) =>
                setDraft({ ...draft, hero: { ...draft.hero, title: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Texte de présentation</label>
            <textarea
              rows={3}
              value={draft.hero.subtitle}
              onChange={(e) =>
                setDraft({ ...draft, hero: { ...draft.hero, subtitle: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Bouton principal</label>
              <input
                type="text"
                value={draft.hero.primaryButtonLabel}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    hero: { ...draft.hero, primaryButtonLabel: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Bouton secondaire</label>
              <input
                type="text"
                value={draft.hero.secondaryButtonLabel}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    hero: { ...draft.hero, secondaryButtonLabel: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-[#3F3E3A]">Image de fond du Hero</label>
              <button
                type="button"
                onClick={() => setPickerTarget('hero')}
                className="px-3 py-1.5 bg-[#F6F6F7] border border-[#D9D6CF] rounded-lg font-semibold"
              >
                Changer l’image
              </button>
            </div>
            <SafeImage
              src={draft.hero.image}
              alt="Aperçu Hero"
              className="w-full max-w-md aspect-video rounded-lg object-cover border border-[#E3E3E6]"
            />
          </div>
        </div>
      )}

      {/* MASTER TAB */}
      {tab === 'master' && (
        <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-5 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.master.visible}
              onChange={(e) =>
                setDraft({ ...draft, master: { ...draft.master, visible: e.target.checked } })
              }
            />
            <span className="font-semibold text-[#141413]">
              Afficher la section Présentation du Maître
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Nom du Maître</label>
              <input
                type="text"
                value={draft.master.name}
                onChange={(e) =>
                  setDraft({ ...draft, master: { ...draft.master, name: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Titre / Fonction</label>
              <input
                type="text"
                value={draft.master.title}
                onChange={(e) =>
                  setDraft({ ...draft, master: { ...draft.master, title: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Courte biographie</label>
            <textarea
              rows={3}
              value={draft.master.shortBio}
              onChange={(e) =>
                setDraft({ ...draft, master: { ...draft.master, shortBio: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Présentation de l’approche</label>
            <textarea
              rows={3}
              value={draft.master.approach}
              onChange={(e) =>
                setDraft({ ...draft, master: { ...draft.master, approach: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Texte du bouton</label>
              <input
                type="text"
                value={draft.master.buttonLabel}
                onChange={(e) =>
                  setDraft({ ...draft, master: { ...draft.master, buttonLabel: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-[#3F3E3A]">Portrait du Maître</label>
                <button
                  type="button"
                  onClick={() => setPickerTarget('master')}
                  className="px-3 py-1 bg-[#F6F6F7] border border-[#D9D6CF] rounded-md font-semibold"
                >
                  Changer la photo
                </button>
              </div>
              <SafeImage
                src={draft.master.photo}
                alt="Portrait"
                className="w-28 h-36 rounded-lg object-cover border border-[#E3E3E6]"
              />
            </div>
          </div>
        </div>
      )}

      {/* HOME SECTIONS TAB */}
      {tab === 'home' && (
        <div className="space-y-6 text-xs">
          {/* Order of sections */}
          <div className="bg-white border border-[#E3E3E6] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#141413] mb-3">
              Ordre des sections sur l’accueil
            </h3>
            <div className="divide-y divide-[#F0EFEA] border border-[#E3E3E6] rounded-lg">
              {draft.homeSections.sectionOrder.map((key, idx) => (
                <div key={key} className="px-4 py-3 flex items-center justify-between">
                  <span className="font-medium text-[#141413]">
                    {idx + 1}. {SECTION_NAMES[key]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveHomeSection(idx, -1)}
                      className="p-1.5 rounded border border-[#E3E3E6] disabled:opacity-35"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === draft.homeSections.sectionOrder.length - 1}
                      onClick={() => moveHomeSection(idx, 1)}
                      className="p-1.5 rounded border border-[#E3E3E6] disabled:opacity-35"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Products */}
          <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.homeSections.showFeaturedProducts}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    homeSections: { ...draft.homeSections, showFeaturedProducts: e.target.checked },
                  })
                }
              />
              <span className="text-sm font-semibold text-[#141413]">
                Afficher l’aperçu de la boutique sur l’accueil
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Titre de la section</label>
                <input
                  type="text"
                  value={draft.homeSections.featuredProductsTitle}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      homeSections: {
                        ...draft.homeSections,
                        featuredProductsTitle: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Sous-titre</label>
                <input
                  type="text"
                  value={draft.homeSections.featuredProductsSubtitle}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      homeSections: {
                        ...draft.homeSections,
                        featuredProductsSubtitle: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
            </div>

            <div>
              <p className="font-medium text-[#3F3E3A] mb-2">
                Produits affichés sur la page d’accueil ({draft.homeSections.featuredProductIds.length} sélectionnés)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {products.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2.5 p-2.5 border border-[#E3E3E6] rounded-lg cursor-pointer hover:bg-[#FAF9F6]"
                  >
                    <input
                      type="checkbox"
                      checked={draft.homeSections.featuredProductIds.includes(p.id)}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          homeSections: {
                            ...draft.homeSections,
                            featuredProductIds: toggleInList(
                              draft.homeSections.featuredProductIds,
                              p.id,
                            ),
                          },
                        })
                      }
                    />
                    <span className="truncate font-medium text-[#141413]">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Articles */}
          <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.homeSections.showCommunityArticles}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    homeSections: {
                      ...draft.homeSections,
                      showCommunityArticles: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm font-semibold text-[#141413]">
                Afficher les derniers articles sur l’accueil
              </span>
            </label>

            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Titre de la section</label>
              <input
                type="text"
                value={draft.homeSections.featuredArticlesTitle}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    homeSections: {
                      ...draft.homeSections,
                      featuredArticlesTitle: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg max-w-md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {articles
                .filter((a) => a.status === 'Publié')
                .map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2.5 p-2.5 border border-[#E3E3E6] rounded-lg cursor-pointer hover:bg-[#FAF9F6]"
                  >
                    <input
                      type="checkbox"
                      checked={draft.homeSections.featuredArticleIds.includes(a.id)}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          homeSections: {
                            ...draft.homeSections,
                            featuredArticleIds: toggleInList(
                              draft.homeSections.featuredArticleIds,
                              a.id,
                            ),
                          },
                        })
                      }
                    />
                    <span className="truncate font-medium text-[#141413]">{a.title}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Featured Videos */}
          <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.homeSections.showCommunityVideos}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    homeSections: {
                      ...draft.homeSections,
                      showCommunityVideos: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm font-semibold text-[#141413]">
                Afficher les dernières vidéos YouTube sur l’accueil
              </span>
            </label>

            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Titre de la section</label>
              <input
                type="text"
                value={draft.homeSections.featuredVideosTitle}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    homeSections: {
                      ...draft.homeSections,
                      featuredVideosTitle: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg max-w-md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {videos
                .filter((v) => v.visible)
                .map((v) => (
                  <label
                    key={v.id}
                    className="flex items-center gap-2.5 p-2.5 border border-[#E3E3E6] rounded-lg cursor-pointer hover:bg-[#FAF9F6]"
                  >
                    <input
                      type="checkbox"
                      checked={draft.homeSections.featuredVideoIds.includes(v.id)}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          homeSections: {
                            ...draft.homeSections,
                            featuredVideoIds: toggleInList(
                              draft.homeSections.featuredVideoIds,
                              v.id,
                            ),
                          },
                        })
                      }
                    />
                    <span className="truncate font-medium text-[#141413]">{v.title}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.homeSections.showTestimonials}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    homeSections: {
                      ...draft.homeSections,
                      showTestimonials: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm font-semibold text-[#141413]">
                Afficher les témoignages des visiteurs sur l’accueil
              </span>
            </label>

            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Titre de la section</label>
              <input
                type="text"
                value={draft.homeSections.featuredTestimonialsTitle}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    homeSections: {
                      ...draft.homeSections,
                      featuredTestimonialsTitle: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg max-w-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* ABOUT PAGE TAB */}
      {tab === 'about' && (
        <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Titre de la page À propos</label>
            <input
              type="text"
              value={draft.aboutPage.heroTitle}
              onChange={(e) =>
                setDraft({ ...draft, aboutPage: { ...draft.aboutPage, heroTitle: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Sous-titre</label>
            <textarea
              rows={2}
              value={draft.aboutPage.heroSubtitle}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  aboutPage: { ...draft.aboutPage, heroSubtitle: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Titre Philosophie</label>
              <input
                type="text"
                value={draft.aboutPage.philosophyTitle}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    aboutPage: { ...draft.aboutPage, philosophyTitle: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg mb-2"
              />
              <textarea
                rows={5}
                value={draft.aboutPage.philosophyBody}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    aboutPage: { ...draft.aboutPage, philosophyBody: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Titre Atelier</label>
              <input
                type="text"
                value={draft.aboutPage.lineageTitle}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    aboutPage: { ...draft.aboutPage, lineageTitle: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg mb-2"
              />
              <textarea
                rows={5}
                value={draft.aboutPage.lineageBody}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    aboutPage: { ...draft.aboutPage, lineageBody: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-[#3F3E3A]">Image de la page À propos</label>
              <button
                type="button"
                onClick={() => setPickerTarget('about')}
                className="px-3 py-1 bg-[#F6F6F7] border border-[#D9D6CF] rounded-md font-semibold"
              >
                Choisir une image
              </button>
            </div>
            <SafeImage
              src={draft.aboutPage.image}
              alt="À propos"
              className="w-32 h-40 rounded-lg object-cover border border-[#E3E3E6]"
            />
          </div>
        </div>
      )}

      {/* CONTACT PAGE TAB */}
      {tab === 'contact' && (
        <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Titre page Contact</label>
            <input
              type="text"
              value={draft.contactPage.title}
              onChange={(e) =>
                setDraft({ ...draft, contactPage: { ...draft.contactPage, title: e.target.value } })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Texte d’introduction</label>
            <textarea
              rows={2}
              value={draft.contactPage.subtitle}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  contactPage: { ...draft.contactPage, subtitle: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Horaires d’accueil</label>
            <input
              type="text"
              value={draft.contactPage.sanctuaryHours}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  contactPage: { ...draft.contactPage, sanctuaryHours: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Note de confirmation</label>
            <textarea
              rows={2}
              value={draft.contactPage.consultationNote}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  contactPage: { ...draft.contactPage, consultationNote: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>
        </div>
      )}

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        media={media}
        defaultFolder="site"
        onMediaAdded={onMediaAdded}
        onSelect={(url) => {
          if (pickerTarget === 'hero') {
            setDraft({ ...draft, hero: { ...draft.hero, image: url } });
          } else if (pickerTarget === 'master') {
            setDraft({ ...draft, master: { ...draft.master, photo: url } });
          } else if (pickerTarget === 'about') {
            setDraft({ ...draft, aboutPage: { ...draft.aboutPage, image: url } });
          }
          setPickerTarget(null);
        }}
        onClose={() => setPickerTarget(null)}
      />
    </form>
  );
}
