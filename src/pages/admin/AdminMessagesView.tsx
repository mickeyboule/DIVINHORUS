import { MailCheck, MailOpen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { adminApi } from '../../lib/api';
import { formatDateTimeFr } from '../../lib/format';
import type { ContactMessage } from '../../types/cms';

interface AdminMessagesViewProps {
  messages: ContactMessage[];
  onMessagesChanged: (messages: ContactMessage[]) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function AdminMessagesView({
  messages,
  onMessagesChanged,
  onNotify,
}: AdminMessagesViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);

  const handleToggleRead = async (msg: ContactMessage) => {
    try {
      const res = await adminApi.markMessageRead(msg.id, !msg.read);
      onMessagesChanged(messages.map((m) => (m.id === msg.id ? res.message : m)));
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteMessage(deleteTarget.id);
      onMessagesChanged(messages.filter((m) => m.id !== deleteTarget.id));
      onNotify('success', 'Message supprimé.');
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur suppression.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#141413]">Messages de contact</h2>
        <p className="text-xs text-[#5C5A55] mt-0.5">
          Messages envoyés par les visiteurs depuis la page Contact du site.
        </p>
      </div>

      <div className="bg-white border border-[#E3E3E6] rounded-xl divide-y divide-[#F0EFEA]">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-5 ${!msg.read ? 'bg-[#FAF9F6]' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#141413]">{msg.name}</span>
                  <span className="text-[#6B6860]">·</span>
                  <span className="text-[#5C5A55]">{msg.email}</span>
                  {msg.phone && (
                    <>
                      <span className="text-[#6B6860]">·</span>
                      <span className="font-mono text-[#5C5A55]">{msg.phone}</span>
                    </>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-[#141413] mt-1">{msg.subject}</h3>
                <p className="text-xs sm:text-sm text-[#3F3E3A] mt-2 leading-relaxed whitespace-pre-line">
                  {msg.message}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-[#8A877E] mt-2">
                  Reçu le {formatDateTimeFr(msg.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleRead(msg)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#E3E3E6] rounded-lg hover:bg-[#F6F6F7]"
                >
                  {msg.read ? (
                    <>
                      <MailOpen className="w-3.5 h-3.5" /> Marquer non lu
                    </>
                  ) : (
                    <>
                      <MailCheck className="w-3.5 h-3.5 text-[#8F6B18]" /> Marquer lu
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(msg)}
                  aria-label="Supprimer le message"
                  className="p-1.5 rounded-lg text-[#5C5A55] hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="p-10 text-center text-sm text-[#5C5A55]">
            Aucun message reçu pour le moment.
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer ce message ?"
        description={`Le message de « ${deleteTarget?.name} » sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
