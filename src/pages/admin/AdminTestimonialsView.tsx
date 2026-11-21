import { Eye, EyeOff, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { adminApi } from '../../lib/api';
import { formatDateFr } from '../../lib/format';
import type { Testimonial, TestimonialStatus } from '../../types/cms';

interface AdminTestimonialsViewProps {
  testimonials: Testimonial[];
  onTestimonialsChanged: (testimonials: Testimonial[]) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function AdminTestimonialsView({
  testimonials,
  onTestimonialsChanged,
  onNotify,
}: AdminTestimonialsViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | TestimonialStatus>('all');
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  const filtered = testimonials.filter((t) =>
    filterStatus === 'all' ? true : t.status === filterStatus,
  );

  const handleUpdate = async (
    item: Testimonial,
    patch: { status?: TestimonialStatus; featured?: boolean },
  ) => {
    try {
      const res = await adminApi.updateTestimonial(item.id, patch);
      onTestimonialsChanged(
        testimonials.map((t) => (t.id === res.testimonial.id ? res.testimonial : t)),
      );
      onNotify('success', 'Témoignage mis à jour.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur de mise à jour.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteTestimonial(deleteTarget.id);
      onTestimonialsChanged(testimonials.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      onNotify('success', 'Témoignage supprimé.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur de suppression.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Témoignages des visiteurs</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5 tabular-nums">
            {testimonials.length} témoignages reçus ·{' '}
            {testimonials.filter((t) => t.status === 'Publié').length} publiés sur le site
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'Publié', 'En attente', 'Masqué'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                filterStatus === status
                  ? 'bg-[#141413] text-white'
                  : 'bg-white border border-[#E3E3E6] text-[#5C5A55] hover:text-[#141413]'
              }`}
            >
              {status === 'all' ? 'Tous' : status}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E3E3E6] rounded-xl p-10 text-center text-xs text-[#5C5A55]">
          Aucun témoignage dans cette catégorie.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#E3E3E6] rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#141413]">{item.authorName}</p>
                    <p className="text-[11px] text-[#6B6860] mt-0.5">
                      {item.authorLocation || 'Visiteur'} · {formatDateFr(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= item.rating ? 'fill-[#8A6D3B] text-[#8A6D3B]' : 'text-[#E3E3E6]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-xs text-[#3F3E3A] leading-relaxed">
                  « {item.content} »
                </p>
              </div>

              <div className="pt-3 border-t border-[#F0EFEA] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void handleUpdate(item, {
                        status: item.status === 'Publié' ? 'Masqué' : 'Publié',
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium border ${
                      item.status === 'Publié'
                        ? 'bg-[#8F6B18]/8 border-[#8F6B18]/30 text-[#8F6B18]'
                        : 'bg-[#F6F6F7] border-[#E3E3E6] text-[#5C5A55]'
                    }`}
                  >
                    {item.status === 'Publié' ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    <span>{item.status === 'Publié' ? 'Publié' : 'Masqué — Publier'}</span>
                  </button>

                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#5C5A55]">
                    <input
                      type="checkbox"
                      checked={item.featured}
                      onChange={(e) => void handleUpdate(item, { featured: e.target.checked })}
                    />
                    <span>À la une (Accueil)</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  aria-label="Supprimer le témoignage"
                  className="p-1.5 text-[#8A877E] hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer ce témoignage ?"
        description={
          deleteTarget
            ? `Le témoignage de ${deleteTarget.authorName} sera définitivement supprimé.`
            : ''
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
