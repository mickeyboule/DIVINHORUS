import { ArrowDown, ArrowUp, Eye, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { SafeImage } from '../../components/SafeImage';
import { WelcomeAnnouncementModal } from '../../components/WelcomeAnnouncementModal';
import { adminApi } from '../../lib/api';
import type {
  Article,
  FaqCategory,
  FaqItem,
  MediaItem,
  Product,
  SiteContent,
  VideoItem,
  WelcomeAnnouncement,
  WelcomeAnnouncementType,
} from '../../types/cms';

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

const DEFAULT_ANNOUNCEMENT: WelcomeAnnouncement = {
  enabled: true,
  type: 'welcome',
  kicker: 'Mot d’accueil',
  title: 'Bienvenue dans l’espace DIVIN HORUS',
  message:
    'Nous sommes heureux de vous accueillir. Découvrez nos enseignements, méditations guidées et objets rituels façonnés avec sobriété.',
  buttonLabel: 'Découvrir la boutique',
  buttonTarget: '/boutique',
  image: '',
  displayFrequency: 'every_visit',
  version: 'v1',
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
  const [isDirty, setIsDirty] = useState(false);
  const [tab, setTab] = useState<'hero' | 'announcement' | 'master' | 'home' | 'about' | 'contact'>(
    'hero',
  );
  const [pickerTarget, setPickerTarget] = useState<
    'hero' | 'master' | 'about' | 'announcement' | null
  >(null);
  const [previewAnnouncementOpen, setPreviewAnnouncementOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setDraft(siteContent);
    }
  }, [siteContent, isDirty]);

  const updateDraft = (updater: SiteContent | ((prev: SiteContent) => SiteContent)) => {
    setIsDirty(true);
    setDraft(updater);
  };

  const persistSiteContent = async (nextContent: SiteContent, successMessage: string) => {
    setSaving(true);
    try {
      const res = await adminApi.updateSiteContent(nextContent);
      setDraft(res.siteContent);
      setIsDirty(false);
      onSiteContentChanged(res.siteContent);
      onNotify('success', successMessage);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const announcementDraft: WelcomeAnnouncement = draft.welcomeAnnouncement || DEFAULT_ANNOUNCEMENT;
  const updateAnnouncement = (patch: Partial<WelcomeAnnouncement>) => {
    updateDraft((prev) => ({
      ...prev,
      welcomeAnnouncement: {
        ...(prev.welcomeAnnouncement || DEFAULT_ANNOUNCEMENT),
        ...patch,
      },
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await persistSiteContent(draft, 'Contenu du site mis à jour et publié.');
  };

  const toggleInList = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const moveHomeSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    const order = [...draft.homeSections.sectionOrder];
    if (target < 0 || target >= order.length) return;
    const [moved] = order.splice(idx, 1);
    order.splice(target, 0, moved);
    updateDraft({
      ...draft,
      homeSections: { ...draft.homeSections, sectionOrder: order },
    });
  };

  const faqsList = draft.aboutPage.faqs || [];

  const updateFaqItem = (idx: number, patch: Partial<FaqItem>) => {
    const next = faqsList.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    updateDraft({
      ...draft,
      aboutPage: { ...draft.aboutPage, faqs: next },
    });
  };

  const addFaqItem = () => {
    const created: FaqItem = {
      id: `faq_${Date.now().toString(36)}`,
      question: '',
      answer: '',
      category: 'Enseignements',
      visible: true,
    };
    updateDraft({
      ...draft,
      aboutPage: { ...draft.aboutPage, faqs: [...faqsList, created] },
    });
  };

  const removeFaqItem = (idx: number) => {
    updateDraft({
      ...draft,
      aboutPage: {
        ...draft.aboutPage,
        faqs: faqsList.filter((_, i) => i !== idx),
      },
    });
  };

  const moveFaqItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= faqsList.length) return;
    const next = [...faqsList];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    updateDraft({
      ...draft,
      aboutPage: { ...draft.aboutPage, faqs: next },
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
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isDirty && (
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              Modifications non publiées
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Publier les modifications'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'hero', label: 'Hero d’accueil' },
          { id: 'announcement', label: 'Message d’accueil & Annonce' },
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

      {/* WELCOME / ANNOUNCEMENT TAB */}
      {tab === 'announcement' && (
        <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFECE6]">
            <div>
              <h3 className="text-sm font-semibold text-[#141413]">
                Fenêtre d’information à l’ouverture du site
              </h3>
              <p className="text-[11px] text-[#5C5A55] mt-0.5">
                Dès qu’un visiteur ouvre le site, ce message s’affiche automatiquement (mot de bienvenue ou grande information concernant la boutique).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewAnnouncementOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F6F6F7] hover:bg-[#ECEAE4] border border-[#D9D6CF] text-[#141413] font-semibold rounded-lg"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Aperçu visiteur</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAnnouncement({ version: `v_${Date.now().toString(36)}` });
                  onNotify(
                    'success',
                    'Version renouvelée : cliquez sur « Publier les modifications » pour réafficher ce message à tous les visiteurs.',
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF9F6] border border-[#D9D6CF] text-[#3F3E3A] font-medium rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rediffuser à tous</span>
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={announcementDraft.enabled}
              onChange={(e) => updateAnnouncement({ enabled: e.target.checked })}
            />
            <span className="font-semibold text-[#141413]">
              Activer le message automatique dès l’ouverture du site
            </span>
          </label>

          <div>
            <label className="block font-medium text-[#3F3E3A] mb-2">Type de message</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'welcome', label: 'Message de bienvenue', defaultKicker: 'Mot d’accueil' },
                  { id: 'info', label: 'Information boutique', defaultKicker: 'Information boutique' },
                  { id: 'important', label: 'Annonce importante', defaultKicker: 'Annonce importante' },
                ] as Array<{ id: WelcomeAnnouncementType; label: string; defaultKicker: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const currentKicker = (announcementDraft.kicker || '').trim();
                    const isDefaultKicker =
                      !currentKicker ||
                      currentKicker === 'Mot d’accueil' ||
                      currentKicker === 'Information boutique' ||
                      currentKicker === 'Annonce importante';
                    updateAnnouncement({
                      type: opt.id,
                      ...(isDefaultKicker ? { kicker: opt.defaultKicker } : {}),
                    });
                  }}
                  className={`px-3.5 py-2.5 rounded-lg border text-left font-medium transition-colors ${
                    announcementDraft.type === opt.id
                      ? 'bg-[#8F6B18] text-white border-[#8F6B18]'
                      : 'bg-[#FAF9F6] text-[#3F3E3A] border-[#D9D6CF] hover:border-[#141413]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Sur-titre (optionnel)</label>
              <input
                type="text"
                value={announcementDraft.kicker || ''}
                onChange={(e) => updateAnnouncement({ kicker: e.target.value })}
                placeholder="Ex : Mot d’accueil, Fermeture annuelle, Nouveauté..."
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Fréquence d’affichage</label>
              <select
                value={announcementDraft.displayFrequency}
                onChange={(e) =>
                  updateAnnouncement({
                    displayFrequency: e.target.value as WelcomeAnnouncement['displayFrequency'],
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg"
              >
                <option value="every_visit">À chaque ouverture du site (par session)</option>
                <option value="once_per_update">
                  Une fois par visiteur jusqu’à la prochaine annonce
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">Titre du message</label>
            <input
              type="text"
              value={announcementDraft.title}
              onChange={(e) => updateAnnouncement({ title: e.target.value })}
              placeholder="Ex : Bienvenue dans la boutique DIVIN HORUS"
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">
              Contenu du message envoyé aux visiteurs
            </label>
            <textarea
              rows={4}
              value={announcementDraft.message}
              onChange={(e) => updateAnnouncement({ message: e.target.value })}
              placeholder="Rédigez votre message de bienvenue ou l’information importante concernant la boutique (délais, nouvel arrivage, promotion, horaires...)."
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">
                Libellé du bouton d’action (optionnel)
              </label>
              <input
                type="text"
                value={announcementDraft.buttonLabel || ''}
                onChange={(e) => updateAnnouncement({ buttonLabel: e.target.value })}
                placeholder="Ex : Découvrir la boutique"
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">
                Page de destination du bouton
              </label>
              <input
                type="text"
                value={announcementDraft.buttonTarget || ''}
                onChange={(e) => updateAnnouncement({ buttonTarget: e.target.value })}
                placeholder="/boutique, /communaute, /contact..."
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[
                  { label: 'Boutique', path: '/boutique' },
                  { label: 'Communauté', path: '/communaute' },
                  { label: 'Suivi commande', path: '/suivi-commande' },
                  { label: 'Contact', path: '/contact' },
                ].map((preset) => (
                  <button
                    key={preset.path}
                    type="button"
                    onClick={() => updateAnnouncement({ buttonTarget: preset.path })}
                    className="px-2 py-1 text-[11px] bg-[#FAF9F6] hover:bg-[#EFECE6] border border-[#E3E3E6] rounded text-[#3F3E3A]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <details className="rounded-lg border border-[#E6E4DF] bg-[#FAF9F6] p-4">
            <summary className="cursor-pointer font-semibold text-[#141413] select-none">
              Version anglaise du message (optionnel — affichée aux visiteurs anglophones)
            </summary>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">
                    Sur-titre (EN, optionnel)
                  </label>
                  <input
                    type="text"
                    value={announcementDraft.kickerEn || ''}
                    onChange={(e) => updateAnnouncement({ kickerEn: e.target.value })}
                    placeholder="Ex: Welcome note, Shop information..."
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">
                    Libellé du bouton (EN, optionnel)
                  </label>
                  <input
                    type="text"
                    value={announcementDraft.buttonLabelEn || ''}
                    onChange={(e) => updateAnnouncement({ buttonLabelEn: e.target.value })}
                    placeholder="Ex: Explore the shop"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">
                  Titre du message (EN, optionnel)
                </label>
                <input
                  type="text"
                  value={announcementDraft.titleEn || ''}
                  onChange={(e) => updateAnnouncement({ titleEn: e.target.value })}
                  placeholder="Ex: Welcome to DIVIN HORUS"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">
                  Contenu du message (EN, optionnel)
                </label>
                <textarea
                  rows={3}
                  value={announcementDraft.messageEn || ''}
                  onChange={(e) => updateAnnouncement({ messageEn: e.target.value })}
                  placeholder="English version of your announcement..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg"
                />
              </div>
            </div>
          </details>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-[#3F3E3A]">
                Image d’illustration (optionnel)
              </label>
              <div className="flex items-center gap-2">
                {announcementDraft.image && (
                  <button
                    type="button"
                    onClick={() => updateAnnouncement({ image: '' })}
                    className="px-3 py-1.5 bg-white border border-[#D9D6CF] rounded-lg text-red-700 hover:bg-red-50 font-medium"
                  >
                    Retirer l’image
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPickerTarget('announcement')}
                  className="px-3 py-1.5 bg-[#F6F6F7] border border-[#D9D6CF] rounded-lg font-semibold"
                >
                  Choisir une image
                </button>
              </div>
            </div>
            {announcementDraft.image ? (
              <SafeImage
                src={announcementDraft.image}
                alt="Aperçu de l’annonce"
                className="w-full max-w-md aspect-video rounded-lg object-cover border border-[#E3E3E6]"
              />
            ) : (
              <p className="text-[11px] text-[#8A877E]">
                Aucune image sélectionnée (le message s’affichera dans une présentation épurée centrée sur le texte).
              </p>
            )}
          </div>
        </div>
      )}

      {/* HERO TAB */}
      {tab === 'hero' && (
        <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-5 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.hero.visible}
              onChange={(e) =>
                updateDraft({ ...draft, hero: { ...draft.hero, visible: e.target.checked } })
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
                updateDraft({ ...draft, hero: { ...draft.hero, title: e.target.value } })
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
                updateDraft({ ...draft, hero: { ...draft.hero, subtitle: e.target.value } })
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
                  updateDraft({
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
                  updateDraft({
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
                updateDraft({ ...draft, master: { ...draft.master, visible: e.target.checked } })
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
                  updateDraft({ ...draft, master: { ...draft.master, name: e.target.value } })
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
                  updateDraft({ ...draft, master: { ...draft.master, title: e.target.value } })
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
                updateDraft({ ...draft, master: { ...draft.master, shortBio: e.target.value } })
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
                updateDraft({ ...draft, master: { ...draft.master, approach: e.target.value } })
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
                  updateDraft({ ...draft, master: { ...draft.master, buttonLabel: e.target.value } })
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
                  updateDraft({
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
                    updateDraft({
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
                    updateDraft({
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
                        updateDraft({
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
                  updateDraft({
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
                  updateDraft({
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
                        updateDraft({
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
                  updateDraft({
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
                  updateDraft({
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
                        updateDraft({
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
                  updateDraft({
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
                  updateDraft({
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
                updateDraft({ ...draft, aboutPage: { ...draft.aboutPage, heroTitle: e.target.value } })
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
                updateDraft({
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
                  updateDraft({
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
                  updateDraft({
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
                  updateDraft({
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
                  updateDraft({
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

          {/* FAQ Editor */}
          <div className="pt-5 border-t border-[#E3E3E6] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#141413]">
                  Foire aux questions (FAQ) — Page À propos
                </h3>
                <p className="text-xs text-[#5C5A55] mt-0.5">
                  Gérez les questions fréquentes sur les enseignements et la boutique. Pensez à cliquer sur « Publier les modifications ».
                </p>
              </div>
              <button
                type="button"
                onClick={addFaqItem}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#141413] text-white font-semibold rounded-lg hover:bg-[#8F6B18] transition-colors self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une question</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Titre de la section FAQ</label>
                <input
                  type="text"
                  value={draft.aboutPage.faqTitle ?? 'Questions fréquentes'}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      aboutPage: { ...draft.aboutPage, faqTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Sous-titre FAQ</label>
                <input
                  type="text"
                  value={draft.aboutPage.faqSubtitle ?? ''}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      aboutPage: { ...draft.aboutPage, faqSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-3">
              {faqsList.length === 0 ? (
                <p className="text-xs text-[#6B6860] py-4 text-center border border-dashed border-[#D9D6CF] rounded-lg">
                  Aucune question configurée. Cliquez sur « Ajouter une question » pour commencer.
                </p>
              ) : (
                faqsList.map((faq, idx) => (
                  <div
                    key={faq.id}
                    className="p-4 bg-[#FAF9F6] border border-[#E3E3E6] rounded-xl space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[#6B6860] tabular-nums">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <select
                          value={faq.category}
                          onChange={(e) =>
                            updateFaqItem(idx, { category: e.target.value as FaqCategory })
                          }
                          className="px-2.5 py-1 text-xs font-medium bg-white border border-[#D9D6CF] rounded-md"
                        >
                          <option value="Enseignements">Enseignements</option>
                          <option value="Boutique">Boutique</option>
                          <option value="Général">Général</option>
                        </select>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-[#3F3E3A]">
                          <input
                            type="checkbox"
                            checked={faq.visible !== false}
                            onChange={(e) => updateFaqItem(idx, { visible: e.target.checked })}
                          />
                          <span>Visible</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveFaqItem(idx, -1)}
                          title="Monter"
                          className="p-1.5 rounded border border-[#E3E3E6] bg-white disabled:opacity-35"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === faqsList.length - 1}
                          onClick={() => moveFaqItem(idx, 1)}
                          title="Descendre"
                          className="p-1.5 rounded border border-[#E3E3E6] bg-white disabled:opacity-35"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFaqItem(idx)}
                          title="Supprimer cette question"
                          className="p-1.5 rounded border border-[#E3E3E6] bg-white text-[#B42318] hover:bg-[#FEF3F2]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-[#3F3E3A] mb-1">Question</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaqItem(idx, { question: e.target.value })}
                        placeholder="Ex. Comment suivre l’avancement de ma commande ?"
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-[#3F3E3A] mb-1">Réponse</label>
                      <textarea
                        rows={3}
                        value={faq.answer}
                        onChange={(e) => updateFaqItem(idx, { answer: e.target.value })}
                        placeholder="Rédigez une réponse claire et précise..."
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
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
                updateDraft({ ...draft, contactPage: { ...draft.contactPage, title: e.target.value } })
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
                updateDraft({
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
                updateDraft({
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
                updateDraft({
                  ...draft,
                  contactPage: { ...draft.contactPage, consultationNote: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="bg-white border border-[#E3E3E6] rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[#5C5A55]">
          {isDirty
            ? 'Vous avez des modifications non publiées sur cette page.'
            : 'Les images choisies via « Changer la photo » sont enregistrées automatiquement.'}
        </span>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement...' : 'Publier les modifications'}</span>
        </button>
      </div>

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        media={media}
        defaultFolder="site"
        onMediaAdded={onMediaAdded}
        onSelect={(url) => {
          const target = pickerTarget;
          setPickerTarget(null);
          if (!target) return;
          let nextDraft: SiteContent = draft;
          let msg = 'Image enregistrée et publiée.';
          if (target === 'hero') {
            nextDraft = { ...draft, hero: { ...draft.hero, image: url } };
            msg = 'Image d’accueil enregistrée et publiée.';
          } else if (target === 'master') {
            nextDraft = { ...draft, master: { ...draft.master, photo: url } };
            msg = 'Portrait du Maître enregistré et publié.';
          } else if (target === 'about') {
            nextDraft = { ...draft, aboutPage: { ...draft.aboutPage, image: url } };
            msg = 'Image À propos enregistrée et publiée.';
          } else if (target === 'announcement') {
            nextDraft = {
              ...draft,
              welcomeAnnouncement: { ...announcementDraft, image: url },
            };
            msg = 'Image d’annonce enregistrée et publiée.';
          }
          setDraft(nextDraft);
          void persistSiteContent(nextDraft, msg);
        }}
        onClose={() => setPickerTarget(null)}
      />

      <WelcomeAnnouncementModal
        open={previewAnnouncementOpen}
        announcement={announcementDraft}
        siteName="DIVIN HORUS"
        onClose={() => setPreviewAnnouncementOpen(false)}
        onNavigate={() => setPreviewAnnouncementOpen(false)}
      />
    </form>
  );
}
