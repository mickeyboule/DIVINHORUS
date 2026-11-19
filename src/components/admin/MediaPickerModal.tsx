import { Check, Upload, X } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { adminApi } from '../../lib/api';
import { prepareImageDataUrl } from '../../lib/imageUpload';
import type { MediaFolder, MediaItem } from '../../types/cms';
import { SafeImage } from '../SafeImage';

interface MediaPickerModalProps {
  open: boolean;
  media: MediaItem[];
  defaultFolder?: MediaFolder;
  onSelect: (url: string) => void;
  onMediaAdded: (item: MediaItem) => void;
  onClose: () => void;
}

export function MediaPickerModal({
  open,
  media,
  defaultFolder = 'site',
  onSelect,
  onMediaAdded,
  onClose,
}: MediaPickerModalProps) {
  const [folderFilter, setFolderFilter] = useState<'all' | MediaFolder>('all');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const filtered =
    folderFilter === 'all' ? media : media.filter((m) => m.folder === folderFilter);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const dataUrl = await prepareImageDataUrl(file);
      const res = await adminApi.uploadMedia({
        name: file.name.replace(/\.[^.]+$/, ''),
        folder: defaultFolder,
        dataUrl,
      });
      onMediaAdded(res.media);
      onSelect(res.media.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléversement.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choisir une image"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] bg-white border border-[#E3E3E6] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E3E3E6] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#141413]">Bibliothèque média</h3>
            <p className="text-xs text-[#5C5A55]">
              Sélectionnez une image existante ou téléversez un nouveau fichier.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5A55] hover:bg-[#F3F2EE]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 bg-[#F7F7F8] border-b border-[#E3E3E6] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'produits', 'articles', 'categories', 'site'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFolderFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  folderFilter === f
                    ? 'bg-[#141413] text-white'
                    : 'bg-white border border-[#E3E3E6] text-[#5C5A55] hover:text-[#141413]'
                }`}
              >
                {f === 'all' ? 'Tout' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#2A4036] hover:bg-[#20322A] text-white rounded-lg cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Téléversement...' : 'Téléverser une image'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.url)}
                className="group text-left border border-[#E3E3E6] rounded-lg overflow-hidden hover:border-[#2A4036] transition-colors bg-[#FAF9F6]"
              >
                <div className="relative aspect-[4/3] bg-[#EFECE6] overflow-hidden">
                  <SafeImage
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                  />
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2A4036] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-[#141413] truncate">{item.name}</p>
                  <p className="text-[11px] text-[#6B6860] truncate">{item.sizeLabel}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
