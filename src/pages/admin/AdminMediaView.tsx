import { Check, Copy, Link, Trash2, Upload } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { SafeImage } from '../../components/SafeImage';
import { adminApi } from '../../lib/api';
import { prepareImageDataUrl } from '../../lib/imageUpload';
import type { MediaFolder, MediaItem } from '../../types/cms';

interface AdminMediaViewProps {
  media: MediaItem[];
  onMediaChanged: (media: MediaItem[]) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function AdminMediaView({
  media,
  onMediaChanged,
  onNotify,
}: AdminMediaViewProps) {
  const [folderFilter, setFolderFilter] = useState<'all' | MediaFolder>('all');
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>('produits');
  const [uploading, setUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [externalName, setExternalName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);

  const filtered =
    folderFilter === 'all' ? media : media.filter((m) => m.folder === folderFilter);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await prepareImageDataUrl(file);
      const res = await adminApi.uploadMedia({
        name: file.name.replace(/\.[^.]+$/, ''),
        folder: uploadFolder,
        dataUrl,
      });
      onMediaChanged([res.media, ...media]);
      onNotify('success', `Image « ${res.media.name} » ajoutée à la médiathèque.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur téléversement.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddExternal = async (e: FormEvent) => {
    e.preventDefault();
    if (!externalUrl.trim()) return;
    try {
      const res = await adminApi.uploadMedia({
        name: externalName.trim() || 'Image externe',
        folder: uploadFolder,
        externalUrl: externalUrl.trim(),
      });
      onMediaChanged([res.media, ...media]);
      setExternalUrl('');
      setExternalName('');
      onNotify('success', 'Image ajoutée via lien.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleCopy = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      onNotify('error', 'Copie impossible.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteMedia(deleteTarget.id);
      onMediaChanged(media.filter((m) => m.id !== deleteTarget.id));
      onNotify('success', 'Média supprimé.');
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur suppression.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#141413]">Bibliothèque média</h2>
        <p className="text-xs text-[#5C5A55] mt-0.5">
          Centralisez les photographies des produits, articles, catégories et visuels du site.
        </p>
      </div>

      {/* Upload & External URL Panel */}
      <div className="bg-white border border-[#E3E3E6] rounded-xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
        <div className="lg:col-span-3">
          <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
            Dossier de destination
          </label>
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value as MediaFolder)}
            className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#D9D6CF] rounded-lg"
          >
            <option value="produits">Produits</option>
            <option value="articles">Articles</option>
            <option value="categories">Catégories</option>
            <option value="site">Visuels du site</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#8F6B18] hover:bg-[#735613] text-white rounded-lg cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Envoi...' : 'Téléverser un fichier'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        </div>

        <form onSubmit={handleAddExternal} className="lg:col-span-6 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={externalName}
            onChange={(e) => setExternalName(e.target.value)}
            placeholder="Nom du média"
            className="sm:w-36 px-3 py-2 text-xs border border-[#D9D6CF] rounded-lg"
          />
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="Ou coller un lien d’image https://..."
            className="flex-1 px-3 py-2 text-xs border border-[#D9D6CF] rounded-lg"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#141413] text-white rounded-lg whitespace-nowrap"
          >
            <Link className="w-3.5 h-3.5" />
            <span>Ajouter lien</span>
          </button>
        </form>
      </div>

      {/* Folder Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: 'all', label: `Tous (${media.length})` },
          { id: 'produits', label: 'Produits' },
          { id: 'articles', label: 'Articles' },
          { id: 'categories', label: 'Catégories' },
          { id: 'site', label: 'Site' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFolderFilter(f.id as typeof folderFilter)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              folderFilter === f.id
                ? 'bg-[#141413] text-white'
                : 'bg-white border border-[#E3E3E6] text-[#5C5A55]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-[#E3E3E6] rounded-xl overflow-hidden flex flex-col"
          >
            <div className="aspect-[4/3] bg-[#F3F2EE]">
              <SafeImage src={item.url} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#141413] truncate">{item.name}</p>
                <p className="text-[11px] text-[#6B6860] truncate">
                  {item.folder} · {item.sizeLabel}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#F0EFEA]">
                <button
                  type="button"
                  onClick={() => handleCopy(item)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8F6B18] hover:underline"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3 h-3" /> Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copier lien
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  aria-label={`Supprimer ${item.name}`}
                  className="text-[#6B6860] hover:text-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer ce média ?"
        description={`Le fichier « ${deleteTarget?.name} » sera retiré de la bibliothèque média.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
