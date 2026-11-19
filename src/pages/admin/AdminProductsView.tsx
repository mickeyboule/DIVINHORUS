import { Copy, Edit3, Eye, EyeOff, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { SafeImage } from '../../components/SafeImage';
import { adminApi } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import type { AvailabilityStatus, Category, MediaItem, Product } from '../../types/cms';

interface AdminProductsViewProps {
  products: Product[];
  categories: Category[];
  media: MediaItem[];
  currencySymbol: string;
  onProductsChanged: (products: Product[]) => void;
  onMediaAdded: (item: MediaItem) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const AVAILABILITY_OPTIONS: AvailabilityStatus[] = [
  'En stock',
  'Sur commande',
  'Édition limitée',
  'Rupture',
];

export function AdminProductsView({
  products,
  categories,
  media,
  currencySymbol,
  onProductsChanged,
  onMediaAdded,
  onNotify,
}: AdminProductsViewProps) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');

  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== 'all' && p.categoryId !== catFilter) return false;
      if (statusFilter === 'active' && !p.active) return false;
      if (statusFilter === 'inactive' && p.active) return false;
      if (statusFilter === 'featured' && !p.featured) return false;
      if (q) {
        const hay = `${p.name} ${p.reference} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, catFilter, statusFilter, search]);

  const openNew = () => {
    setEditing({
      name: '',
      reference: `EV-${Math.floor(100 + Math.random() * 900)}`,
      price: 45,
      categoryId: categories[0]?.id || '',
      description: '',
      additionalInfo: '',
      images: [],
      availability: 'En stock',
      stockCount: 10,
      featured: false,
      active: true,
    });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const res = await adminApi.updateProduct(editing.id, editing);
        onProductsChanged(products.map((p) => (p.id === res.product.id ? res.product : p)));
        onNotify('success', `Produit « ${res.product.name} » mis à jour.`);
      } else {
        const res = await adminApi.createProduct(editing);
        onProductsChanged([res.product, ...products]);
        onNotify('success', `Produit « ${res.product.name} » créé.`);
      }
      setEditing(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await adminApi.updateProduct(product.id, { active: !product.active });
      onProductsChanged(products.map((p) => (p.id === product.id ? res.product : p)));
      onNotify('success', res.product.active ? 'Produit activé sur la boutique.' : 'Produit masqué.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const res = await adminApi.updateProduct(product.id, { featured: !product.featured });
      onProductsChanged(products.map((p) => (p.id === product.id ? res.product : p)));
      onNotify(
        'success',
        res.product.featured ? 'Produit mis en avant.' : 'Produit retiré de la mise en avant.',
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const res = await adminApi.duplicateProduct(product.id);
      onProductsChanged([res.product, ...products]);
      onNotify('success', `Produit dupliqué : « ${res.product.name} ».`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur duplication.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteProduct(deleteTarget.id);
      onProductsChanged(products.filter((p) => p.id !== deleteTarget.id));
      onNotify('success', `Produit « ${deleteTarget.name} » supprimé.`);
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur suppression.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Produits</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Gérez l’ensemble de votre catalogue, photos, disponibilités et mises en avant.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2A4036] hover:bg-[#20322A] text-white text-xs font-semibold rounded-lg self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E3E3E6] rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#8A877E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom ou référence..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs uniquement</option>
            <option value="inactive">Masqués</option>
            <option value="featured">Mis en avant</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#E3E3E6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3E3E6] bg-[#FAFAFA] text-[11px] font-semibold text-[#6B6860]">
                <th className="py-3 px-4">Produit</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-right">Prix</th>
                <th className="py-3 px-4">Disponibilité</th>
                <th className="py-3 px-4 text-center">En avant</th>
                <th className="py-3 px-4 text-center">Visibilité</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA] text-xs">
              {filtered.map((product) => {
                const cat = categories.find((c) => c.id === product.categoryId);
                return (
                  <tr key={product.id} className="hover:bg-[#FAFAFA]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={product.images[0]}
                          alt={product.name}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-[#E3E3E6]"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#141413] truncate max-w-[230px]">
                            {product.name}
                          </p>
                          <p className="text-[11px] font-mono text-[#6B6860]">{product.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5C5A55]">{cat?.name || 'Sans catégorie'}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-[#141413]">
                      {formatPrice(product.price, currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-[#3F3E3A]">
                      {product.availability}{' '}
                      <span className="font-mono text-[#6B6860] tabular-nums">
                        ({product.stockCount})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(product)}
                        title={product.featured ? 'Retirer de la mise en avant' : 'Mettre en avant'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          product.featured
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-[#8A877E] hover:bg-[#F3F2EE]'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${product.featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                          product.active
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}
                      >
                        {product.active ? (
                          <>
                            <Eye className="w-3 h-3" /> Actif
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Masqué
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing({ ...product })}
                          aria-label={`Modifier ${product.name}`}
                          className="p-1.5 rounded-lg text-[#5C5A55] hover:text-[#141413] hover:bg-[#F3F2EE]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(product)}
                          aria-label={`Dupliquer ${product.name}`}
                          className="p-1.5 rounded-lg text-[#5C5A55] hover:text-[#141413] hover:bg-[#F3F2EE]"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          aria-label={`Supprimer ${product.name}`}
                          className="p-1.5 rounded-lg text-[#5C5A55] hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[#5C5A55]">
                    Aucun produit dans cette sélection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <form
            onSubmit={handleSave}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white border border-[#E3E3E6] rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E3E3E6] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#141413]">
                {editing.id ? 'Modifier le produit' : 'Nouveau produit'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5A55] hover:bg-[#F3F2EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-[#3F3E3A] mb-1">Nom du produit *</label>
                  <input
                    type="text"
                    required
                    value={editing.name || ''}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Référence (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={editing.reference || ''}
                    onChange={(e) => setEditing({ ...editing, reference: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">
                    Prix ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={editing.price ?? 0}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Catégorie *</label>
                  <select
                    required
                    value={editing.categoryId || ''}
                    onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Disponibilité</label>
                  <select
                    value={editing.availability || 'En stock'}
                    onChange={(e) =>
                      setEditing({ ...editing, availability: e.target.value as AvailabilityStatus })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">
                  Informations complémentaires (composition, dimensions, usage)
                </label>
                <textarea
                  rows={2}
                  value={editing.additionalInfo || ''}
                  onChange={(e) => setEditing({ ...editing, additionalInfo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-[#3F3E3A]">Photos du produit</label>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="px-3 py-1.5 bg-[#F6F6F7] border border-[#D9D6CF] rounded-lg font-semibold text-[#141413] hover:bg-[#EFECE6]"
                  >
                    + Ajouter une photo depuis la médiathèque
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(editing.images || []).map((img, idx) => (
                    <div
                      key={`${img}-${idx}`}
                      className="relative w-24 h-20 rounded-lg overflow-hidden border border-[#E3E3E6]"
                    >
                      <SafeImage src={img} alt="Aperçu" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            images: (editing.images || []).filter((_, i) => i !== idx),
                          })
                        }
                        aria-label="Retirer l’image"
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(editing.images || []).length === 0 && (
                    <p className="text-[#8A877E]">Aucune photo ajoutée.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#F0EFEA]">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Stock indicatif</label>
                  <input
                    type="number"
                    min="0"
                    value={editing.stockCount ?? 0}
                    onChange={(e) => setEditing({ ...editing, stockCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2 pt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.active)}
                    onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  />
                  <span className="font-medium text-[#141413]">Produit actif en boutique</span>
                </label>
                <label className="flex items-center gap-2 pt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.featured)}
                    onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  />
                  <span className="font-medium text-[#141413]">Mettre en avant</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E3E3E6] bg-[#FAFAFA] flex items-center justify-end gap-2.5">
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
                className="px-5 py-2 text-xs font-semibold bg-[#2A4036] hover:bg-[#20322A] text-white rounded-lg"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer le produit'}
              </button>
            </div>
          </form>
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        media={media}
        defaultFolder="produits"
        onMediaAdded={onMediaAdded}
        onSelect={(url) => {
          if (editing) {
            setEditing({ ...editing, images: [...(editing.images || []), url] });
          }
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer ce produit ?"
        description={`Le produit « ${deleteTarget?.name} » sera définitivement retiré de la boutique.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
