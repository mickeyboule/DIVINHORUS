import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Eye,
  EyeOff,
  Link2,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { SafeImage } from '../../components/SafeImage';
import { adminApi } from '../../lib/api';
import type { VideoItem } from '../../types/cms';

interface AdminVideosViewProps {
  videos: VideoItem[];
  onVideosChanged: (videos: VideoItem[]) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function AdminVideosView({
  videos,
  onVideosChanged,
  onNotify,
}: AdminVideosViewProps) {
  const [editing, setEditing] = useState<Partial<VideoItem> | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VideoItem | null>(null);

  const sorted = [...videos].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleLookupYoutube = async () => {
    if (!editing?.youtubeUrl) return;
    setLookingUp(true);
    try {
      const meta = await adminApi.lookupYoutube(editing.youtubeUrl);
      setEditing((prev) => ({
        ...prev,
        youtubeId: meta.youtubeId,
        youtubeUrl: meta.youtubeUrl,
        thumbnail: meta.thumbnail,
        title: prev?.title?.trim() ? prev.title : meta.title,
      }));
      onNotify('success', 'Miniature et titre YouTube récupérés.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Lien YouTube invalide.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const res = await adminApi.updateVideo(editing.id, editing);
        onVideosChanged(videos.map((v) => (v.id === res.video.id ? res.video : v)));
        onNotify('success', 'Vidéo mise à jour.');
      } else {
        const res = await adminApi.createVideo(editing);
        onVideosChanged([...videos, res.video]);
        onNotify('success', 'Vidéo YouTube ajoutée.');
      }
      setEditing(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const copy = [...sorted];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    try {
      const res = await adminApi.reorderVideos(copy.map((v) => v.id));
      onVideosChanged(res.videos);
      onNotify('success', 'Ordre des vidéos mis à jour.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleToggleVisible = async (vid: VideoItem) => {
    try {
      const res = await adminApi.updateVideo(vid.id, { visible: !vid.visible });
      onVideosChanged(videos.map((v) => (v.id === vid.id ? res.video : v)));
      onNotify('success', res.video.visible ? 'Vidéo publiée.' : 'Vidéo masquée.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleToggleFeatured = async (vid: VideoItem) => {
    try {
      const res = await adminApi.updateVideo(vid.id, { featured: !vid.featured });
      onVideosChanged(videos.map((v) => (v.id === vid.id ? res.video : v)));
      onNotify('success', res.video.featured ? 'Vidéo mise en avant.' : 'Retirée de la une.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteVideo(deleteTarget.id);
      onVideosChanged(videos.filter((v) => v.id !== deleteTarget.id));
      onNotify('success', 'Vidéo supprimée.');
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur suppression.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Vidéos YouTube</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Collez un lien YouTube pour récupérer automatiquement la miniature et le titre.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              youtubeUrl: '',
              youtubeId: '',
              title: '',
              thumbnail: '',
              description: '',
              duration: '',
              visible: true,
              featured: false,
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2A4036] hover:bg-[#20322A] text-white text-xs font-semibold rounded-lg self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une vidéo YouTube</span>
        </button>
      </div>

      <div className="bg-white border border-[#E3E3E6] rounded-xl divide-y divide-[#F0EFEA]">
        {sorted.map((vid, idx) => (
          <div
            key={vid.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <SafeImage
                src={vid.thumbnail}
                alt={vid.title}
                className="w-28 h-16 rounded-lg object-cover shrink-0 border border-[#E3E3E6]"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#141413] truncate">{vid.title}</h3>
                <p className="text-xs text-[#5C5A55] truncate mt-0.5">{vid.description}</p>
                <p className="text-[11px] font-mono text-[#8A877E] mt-0.5">
                  ID: {vid.youtubeId} {vid.duration ? `· ${vid.duration}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => handleMove(idx, -1)}
                aria-label="Monter"
                className="p-1.5 rounded-lg border border-[#E3E3E6] text-[#5C5A55] disabled:opacity-35"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={idx === sorted.length - 1}
                onClick={() => handleMove(idx, 1)}
                aria-label="Descendre"
                className="p-1.5 rounded-lg border border-[#E3E3E6] text-[#5C5A55] disabled:opacity-35"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleFeatured(vid)}
                title="Afficher à la une"
                className={`p-1.5 rounded-lg ${
                  vid.featured ? 'text-amber-600 bg-amber-50' : 'text-[#8A877E] hover:bg-[#F3F2EE]'
                }`}
              >
                <Star className={`w-4 h-4 ${vid.featured ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => handleToggleVisible(vid)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${
                  vid.visible
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                {vid.visible ? (
                  <>
                    <Eye className="w-3 h-3" /> Publiée
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" /> Masquée
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditing({ ...vid })}
                aria-label="Modifier"
                className="p-1.5 rounded-lg text-[#5C5A55] hover:text-[#141413] hover:bg-[#F3F2EE]"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(vid)}
                aria-label="Supprimer"
                className="p-1.5 rounded-lg text-[#5C5A55] hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="p-10 text-center text-sm text-[#5C5A55]">
            Aucune vidéo enregistrée.
          </div>
        )}
      </div>

      {/* Video Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <form
            onSubmit={handleSave}
            className="relative z-10 w-full max-w-xl bg-white border border-[#E3E3E6] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E3E3E6] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#141413]">
                {editing.id ? 'Modifier la vidéo' : 'Ajouter une vidéo YouTube'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="text-[#5C5A55]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Lien YouTube *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={editing.youtubeUrl || ''}
                    onChange={(e) => setEditing({ ...editing, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                  <button
                    type="button"
                    disabled={lookingUp || !editing.youtubeUrl}
                    onClick={handleLookupYoutube}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#141413] text-white font-semibold rounded-lg disabled:opacity-50 whitespace-nowrap"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{lookingUp ? 'Recherche...' : 'Récupérer les infos'}</span>
                  </button>
                </div>
              </div>

              {editing.thumbnail && (
                <div className="flex items-center gap-3 p-3 bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg">
                  <SafeImage
                    src={editing.thumbnail}
                    alt="Miniature YouTube"
                    className="w-28 h-16 rounded object-cover shrink-0"
                  />
                  <div className="text-[11px] text-[#5C5A55] space-y-0.5 min-w-0">
                    <p className="font-semibold text-[#141413]">Miniature récupérée</p>
                    <p className="font-mono truncate">ID YouTube : {editing.youtubeId}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Titre *</label>
                <input
                  type="text"
                  required
                  value={editing.title || ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-[#3F3E3A] mb-1">URL Miniature</label>
                  <input
                    type="text"
                    value={editing.thumbnail || ''}
                    onChange={(e) => setEditing({ ...editing, thumbnail: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Durée (ex : 12:30)</label>
                  <input
                    type="text"
                    value={editing.duration || ''}
                    onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Description courte</label>
                <textarea
                  rows={3}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.visible !== false}
                    onChange={(e) => setEditing({ ...editing, visible: e.target.checked })}
                  />
                  <span className="font-medium text-[#141413]">Publier dans Communauté</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.featured)}
                    onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  />
                  <span className="font-medium text-[#141413]">Mettre en avant sur l’accueil</span>
                </label>
              </div>
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
                {saving ? 'Enregistrement...' : 'Enregistrer la vidéo'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer cette vidéo ?"
        description={`La vidéo « ${deleteTarget?.title} » sera retirée du site.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
