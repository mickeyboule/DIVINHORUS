import { ArrowDown, ArrowUp, Edit3, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { SafeImage } from '../../components/SafeImage';
import { adminApi } from '../../lib/api';
import type { Category, MediaItem, Product } from '../../types/cms';

interface AdminCategoriesViewProps {
  categories: Category[];
  products: Product[];
  media: MediaItem[];
  onCategoriesChanged: (categories: Category[]) => void;
  onMediaAdded: (item: MediaItem) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function AdminCategoriesView({
  categories,
  products,
  media,
  onCategoriesChanged,
  onMediaAdded,
  onNotify,
}: AdminCategoriesViewProps) {
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const res = await adminApi.updateCategory(editing.id, editing);
        onCategoriesChanged(categories.map((c) => (c.id === res.category.id ? res.category : c)));
        onNotify('success', `Catégorie « ${res.category.name} » modifiée.`);
      } else {
        const res = await adminApi.createCategory(editing);
        onCategoriesChanged([...categories, res.category]);
        onNotify('success', `Catégorie « ${res.category.name} » créée.`);
      }
      setEditing(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const copy = [...sorted];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    try {
      const res = await adminApi.reorderCategories(copy.map((c) => c.id));
      onCategoriesChanged(res.categories);
      onNotify('success', 'Ordre des catégories mis à jour.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur réorganisation.');
    }
  };

  const handleToggleVisible = async (cat: Category) => {
    try {
      const res = await adminApi.updateCategory(cat.id, { visible: !cat.visible });
      onCategoriesChanged(categories.map((c) => (c.id === cat.id ? res.category : c)));
      onNotify('success', res.category.visible ? 'Catégorie affichée.' : 'Catégorie masquée.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      onCategoriesChanged(categories.filter((c) => c.id !== deleteTarget.id));
      onNotify('success', `Catégorie « ${deleteTarget.name} » supprimée.`);
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur suppression.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Catégories de produits</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Créez, modifiez, masquez ou réorganisez les catégories affichées sur la boutique.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ name: '', description: '', image: '', visible: true })}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2A4036] hover:bg-[#20322A] text-white text-xs font-semibold rounded-lg self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle catégorie</span>
        </button>
      </div>

      <div className="bg-white border border-[#E3E3E6] rounded-xl divide-y divide-[#F0EFEA]">
        {sorted.map((cat, idx) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <div key={cat.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <SafeImage
                  src={cat.image}
                  alt={cat.name}
                  className="w-16 h-12 rounded-lg object-cover shrink-0 border border-[#E3E3E6]"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#141413] truncate">{cat.name}</h3>
                    <span className="text-xs font-mono tabular-nums text-[#6B6860]">
                      ({count} produit{count > 1 ? 's' : ''})
                    </span>
                  </div>
                  <p className="text-xs text-[#5C5A55] truncate mt-0.5">{cat.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, -1)}
                  aria-label="Monter"
                  className="p-1.5 rounded-lg border border-[#E3E3E6] text-[#5C5A55] hover:text-[#141413] disabled:opacity-35"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === sorted.length - 1}
                  onClick={() => handleMove(idx, 1)}
                  aria-label="Descendre"
                  className="p-1.5 rounded-lg border border-[#E3E3E6] text-[#5C5A55] hover:text-[#141413] disabled:opacity-35"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleVisible(cat)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${
                    cat.visible
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {cat.visible ? (
                    <>
                      <Eye className="w-3 h-3" /> Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" /> Masquée
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing({ ...cat })}
                  aria-label={`Modifier ${cat.name}`}
                  className="p-1.5 rounded-lg text-[#5C5A55] hover:text-[#141413] hover:bg-[#F3F2EE]"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(cat)}
                  aria-label={`Supprimer ${cat.name}`}
                  className="p-1.5 rounded-lg text-[#5C5A55] hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="p-10 text-center text-sm text-[#5C5A55]">
            Aucune catégorie définie.
          </div>
        )}
      </div>

      {/* Category Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <form
            onSubmit={handleSave}
            className="relative z-10 w-full max-w-lg bg-white border border-[#E3E3E6] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E3E3E6] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#141413]">
                {editing.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="text-[#5C5A55]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-[#3F3E3A]">Image d’illustration</label>
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
                    className="w-36 h-24 rounded-lg object-cover border border-[#E3E3E6]"
                  />
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.visible !== false}
                  onChange={(e) => setEditing({ ...editing, visible: e.target.checked })}
                />
                <span className="font-medium text-[#141413]">Catégorie visible sur le site</span>
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
                className="px-4 py-2 text-xs font-semibold bg-[#2A4036] text-white rounded-lg"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        media={media}
        defaultFolder="categories"
        onMediaAdded={onMediaAdded}
        onSelect={(url) => {
          if (editing) setEditing({ ...editing, image: url });
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer cette catégorie ?"
        description={`La catégorie « ${deleteTarget?.name} » disparaîtra immédiatement de la boutique.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
