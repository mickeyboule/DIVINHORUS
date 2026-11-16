import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { adminApi } from '../../lib/api';
import { formatDateTimeFr, formatPrice, getOrderStatusStyle } from '../../lib/format';
import type { Customer, Order } from '../../types/cms';

interface AdminCustomersViewProps {
  customers: Customer[];
  orders: Order[];
  currencySymbol: string;
  onCustomerUpdated: (cust: Customer) => void;
  onInspectOrder: (orderId: string) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function AdminCustomersView({
  customers,
  orders,
  currencySymbol,
  onCustomerUpdated,
  onInspectOrder,
  onNotify,
}: AdminCustomersViewProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedId) || null;
  const customerOrders = selectedCustomer
    ? orders.filter((o) => o.customerId === selectedCustomer.id)
    : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.phone} ${c.email} ${c.address}`.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const openCustomer = (c: Customer) => {
    setSelectedId(c.id);
    setNotes(c.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      const res = await adminApi.updateCustomerNotes(selectedCustomer.id, notes);
      onCustomerUpdated(res.customer);
      onNotify('success', 'Fiche client enregistrée.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Clients</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Annuaire complet et historique des demandes par client.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8A877E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E3E3E6] rounded-lg focus:border-[#2A4036] focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E3E3E6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3E3E6] bg-[#FAFAFA] text-[11px] font-semibold text-[#6B6860]">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-right">Commandes</th>
                <th className="py-3 px-4">Dernière commande</th>
                <th className="py-3 px-4 text-right">Total indicatif</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA] text-xs">
              {filtered.map((cust) => (
                <tr
                  key={cust.id}
                  onClick={() => openCustomer(cust)}
                  className="hover:bg-[#FAFAFA] cursor-pointer"
                >
                  <td className="py-3 px-4 font-semibold text-[#141413]">
                    {cust.firstName} {cust.lastName}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-[#5C5A55]">
                    {cust.phone}
                  </td>
                  <td className="py-3 px-4 text-[#5C5A55]">{cust.email || '—'}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#141413]">
                    {cust.orderCount}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-[#6B6860] whitespace-nowrap">
                    {formatDateTimeFr(cust.lastOrderAt)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#141413]">
                    {formatPrice(cust.totalIndicative, currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomer(cust);
                      }}
                      className="text-xs font-semibold text-[#2A4036] hover:underline"
                    >
                      Fiche client
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[#5C5A55]">
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSelectedId(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl border-l border-[#E3E3E6] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E3E3E6] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#141413]">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h3>
                <p className="text-xs text-[#6B6860] font-mono tabular-nums">
                  {selectedCustomer.orderCount} commande(s) ·{' '}
                  {formatPrice(selectedCustomer.totalIndicative, currencySymbol)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Fermer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5A55] hover:bg-[#F6F6F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl p-4 space-y-2 text-xs">
                <p>
                  <span className="text-[#6B6860]">Téléphone :</span>{' '}
                  <span className="font-mono text-[#141413]">{selectedCustomer.phone}</span>
                </p>
                <p>
                  <span className="text-[#6B6860]">Email :</span>{' '}
                  <span className="text-[#141413]">{selectedCustomer.email || 'Non renseigné'}</span>
                </p>
                <p>
                  <span className="text-[#6B6860]">Adresse habituelle :</span>{' '}
                  <span className="text-[#141413]">{selectedCustomer.address}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#141413]">
                  Notes sur le client
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Préférences de livraison, accompagnement..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg resize-none"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-[#2A4036] hover:bg-[#20322A] text-white text-xs font-semibold rounded-lg"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer la note'}
                </button>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#141413] mb-3">
                  Historique des commandes ({customerOrders.length})
                </h4>
                <div className="space-y-2.5">
                  {customerOrders.map((ord) => {
                    const st = getOrderStatusStyle(ord.status);
                    return (
                      <div
                        key={ord.id}
                        className="p-3.5 border border-[#E3E3E6] rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#141413]">
                              {ord.orderNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-medium ${st.bg} ${st.text} ${st.border}`}
                            >
                              {st.label}
                            </span>
                          </div>
                          <p className="text-[#5C5A55] truncate mt-1">
                            {ord.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                          </p>
                          <p className="text-[11px] text-[#8A877E] font-mono tabular-nums mt-0.5">
                            {formatDateTimeFr(ord.createdAt)} ·{' '}
                            {formatPrice(ord.indicativeTotal, currencySymbol)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(null);
                            onInspectOrder(ord.id);
                          }}
                          className="text-xs font-semibold text-[#2A4036] hover:underline shrink-0"
                        >
                          Ouvrir
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
