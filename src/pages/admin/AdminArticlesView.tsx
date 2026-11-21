import { Edit3, Globe, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { SafeImage } from '../../components/SafeImage';
import { adminApi } from '../../lib/api';
import { formatDateFr } from '../../lib/format';
import type { Article, ArticleCategory, ArticleStatus, MediaItem } from '../../types/cms';

interface AdminArticlesViewProps {
  articles: Article[];
  articleCategories: ArticleCategory[];
  media: MediaItem[];
  defaultAuthor: string;
  onArticlesChanged: (articles: Article[]) => void;
  onArticleCategoriesChanged: (cats: ArticleCategory[]) => void;
  onMediaAdded: (item: MediaItem) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function AdminArticlesView({
  articles,
  articleCategories,
  media,
  defaultAuthor,
  onArticlesChanged,
  onArticleCategoriesChanged,
  onMediaAdded,
  onNotify,
}: AdminArticlesViewProps) {
  const [tab, setTab] = useState<'all' | 'Publié' | 'Brouillon' | 'categories'>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const [newCatName, setNewCatName] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (tab === 'Publié' && a.status !== 'Publié') return false;
      if (tab === 'Brouillon' && a.status !== 'Brouillon') return false;
      if (q) {
        const hay = `${a.title} ${a.excerpt} ${a.author}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, tab, search]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const res = await adminApi.updateArticle(editing.id, editing);
        onArticlesChanged(articles.map((a) => (a.id === res.article.id ? res.article : a)));
        onNotify('success', `Article « ${res.article.title} » mis à jour.`);
      } else {
        const res = await adminApi.createArticle(editing);
        onArticlesChanged([res.article, ...articles]);
        onNotify('success', `Article « ${res.article.title} » enregistré.`);
      }
      setEditing(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (art: Article) => {
    const nextStatus: ArticleStatus = art.status === 'Publié' ? 'Brouillon' : 'Publié';
    try {
      const res = await adminApi.updateArticle(art.id, { status: nextStatus });
      onArticlesChanged(articles.map((a) => (a.id === art.id ? res.article : a)));
      onNotify('success', nextStatus === 'Publié' ? 'Article publié.' : 'Article passé en brouillon.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteArticle(deleteTarget.id);
      onArticlesChanged(articles.filter((a) => a.id !== deleteTarget.id));
      onNotify('success', 'Article supprimé.');
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur suppression.');
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await adminApi.createArticleCategory(newCatName.trim());
      onArticleCategoriesChanged([...articleCategories, res.category]);
      setNewCatName('');
      onNotify('success', `Rubrique « ${res.category.name} » créée.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await adminApi.deleteArticleCategory(id);
      onArticleCategoriesChanged(articleCategories.filter((c) => c.id !== id));
      onNotify('success', 'Rubrique supprimée.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Communauté · Articles</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Publiez des enseignements, réflexions, conseils et gérez vos brouillons.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              title: '',
              excerpt: '',
              content: '',
              image: '',
              author: defaultAuthor,
              categoryId: articleCategories[0]?.id || '',
              status: 'Publié',
              featured: false,
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#8F6B18] hover:bg-[#735613] text-white text-xs font-semibold rounded-lg self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Rédiger un article</span>
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="bg-white border border-[#E3E3E6] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `Tous (${articles.length})` },
            { id: 'Publié', label: `Publiés (${articles.filter((a) => a.status === 'Publié').length})` },
            { id: 'Brouillon', label: `Brouillons (${articles.filter((a) => a.status === 'Brouillon').length})` },
            { id: 'categories', label: `Catégories (${articleCategories.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === t.id
                  ? 'bg-[#141413] text-white'
                  : 'bg-[#F6F6F7] text-[#5C5A55] hover:text-[#141413]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== 'categories' && (
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#8A877E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg"
            />
          </div>
        )}
      </div>

      {tab === 'categories' ? (
        <div className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-5 max-w-2xl">
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nouvelle catégorie d’articles (ex : Histoires)"
              className="flex-1 px-3 py-2 text-xs border border-[#D9D6CF] rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#8F6B18] text-white text-xs font-semibold rounded-lg"
            >
              Ajouter
            </button>
          </form>

          <div className="divide-y divide-[#F0EFEA] border-t border-[#F0EFEA]">
            {articleCategories.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                <span className="font-medium text-[#141413]">{c.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-[#6B6860] hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E3E3E6] rounded-xl divide-y divide-[#F0EFEA]">
          {filtered.map((art) => {
            const cat = articleCategories.find((c) => c.id === art.categoryId);
            return (
              <div
                key={art.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <SafeImage
                    src={art.image}
                    alt={art.title}
                    className="w-20 h-14 rounded-lg object-cover shrink-0 border border-[#E3E3E6]"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-[#6B6860]">
                      <span>{cat?.name || 'Enseignement'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDateFr(art.publishedAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{art.author}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#141413] truncate mt-0.5">
                      {art.title}
                    </h3>
                    <p className="text-xs text-[#5C5A55] truncate mt-0.5">{art.excerpt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(art)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${
                      art.status === 'Publié'
                        ? 'bg-[#FBF6EA] text-[#7A5C12] border-[#E5D3A1]'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>{art.status}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ ...art })}
                    aria-label="Modifier"
                    className="p-1.5 rounded-lg text-[#5C5A55] hover:text-[#141413] hover:bg-[#F3F2EE]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(art)}
                    aria-label="Supprimer"
                    className="p-1.5 rounded-lg text-[#5C5A55] hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-[#5C5A55]">
              Aucun article trouvé.
            </div>
          )}
        </div>
      )}

      {/* Article Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <form
            onSubmit={handleSave}
            className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-white border border-[#E3E3E6] rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E3E3E6] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#141413]">
                {editing.id ? 'Modifier l’article' : 'Nouvel article'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="text-[#5C5A55]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Titre de l’article *</label>
                <input
                  type="text"
                  required
                  value={editing.title || ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Catégorie</label>
                  <select
                    value={editing.categoryId || ''}
                    onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  >
                    {articleCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Auteur</label>
                  <input
                    type="text"
                    value={editing.author || ''}
                    onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Statut</label>
                  <select
                    value={editing.status || 'Publié'}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as ArticleStatus })}
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  >
                    <option value="Publié">Publié</option>
                    <option value="Brouillon">Brouillon</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-[#3F3E3A]">Image de couverture</label>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="px-3 py-1 bg-[#F6F6F7] border border-[#D9D6CF] rounded-md font-semibold"
                  >
                    Choisir depuis les médias
                  </button>
                </div>
                {editing.image && (
                  <SafeImage
                    src={editing.image}
                    alt="Aperçu"
                    className="w-44 h-28 rounded-lg object-cover border border-[#E3E3E6]"
                  />
                )}
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Extrait / Résumé *</label>
                <textarea
                  rows={2}
                  required
                  value={editing.excerpt || ''}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Contenu complet *</label>
                <textarea
                  rows={8}
                  required
                  value={editing.content || ''}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  placeholder="Séparez les paragraphes par une ligne vide."
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editing.featured)}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                />
                <span className="font-medium text-[#141413]">
                  Mettre en avant sur la page d’accueil
                </span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-[#E3E3E6] bg-[#FAFAFA] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-[#D9D6CF] rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold bg-[#8F6B18] text-white rounded-lg"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer l’article'}
              </button>
            </div>
          </form>
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        media={media}
        defaultFolder="articles"
        onMediaAdded={onMediaAdded}
        onSelect={(url) => {
          if (editing) setEditing({ ...editing, image: url });
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer cet article ?"
        description={`L’article « ${deleteTarget?.title} » sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
