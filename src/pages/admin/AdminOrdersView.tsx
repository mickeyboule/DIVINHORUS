import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SafeImage } from '../../components/SafeImage';
import { adminApi } from '../../lib/api';
import { formatDateTimeFr, formatPrice, getOrderStatusStyle } from '../../lib/format';
import type { Order, OrderStatus } from '../../types/cms';

interface AdminOrdersViewProps {
  orders: Order[];
  currencySymbol: string;
  selectedOrderId: string | null;
  onSelectOrder: (id: string | null) => void;
  onOrderUpdated: (order: Order) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const ALL_STATUSES: OrderStatus[] = ['Nouvelle', 'En cours', 'Confirmée', 'Terminée', 'Annulée'];

export function AdminOrdersView({
  orders,
  currencySymbol,
  selectedOrderId,
  onSelectOrder,
  onOrderUpdated,
  onNotify,
}: AdminOrdersViewProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc'>('date-desc');

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>('Nouvelle');
  const [statusNote, setStatusNote] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const openOrder = (order: Order) => {
    setPendingStatus(order.status);
    setAdminNotes(order.adminNotes);
    setStatusNote('');
    onSelectOrder(order.id);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (q) {
        const hay = `${o.orderNumber} ${o.customerFirstName} ${o.customerLastName} ${o.customerPhone} ${o.deliveryAddress} ${o.items.map((i) => i.productName).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'date-asc') {
      return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (sortBy === 'total-desc') {
      return [...list].sort((a, b) => b.indicativeTotal - a.indicativeTotal);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, search, sortBy]);

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await adminApi.updateOrder(selectedOrder.id, {
        status: pendingStatus,
        adminNotes,
        statusNote,
      });
      onOrderUpdated(res.order);
      setStatusNote('');
      onNotify('success', `Commande ${res.order.orderNumber} mise à jour.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Gestion des commandes</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Suivi des demandes de commande reçues sans paiement en ligne.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-[#E3E3E6] rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#141413] text-white'
                : 'bg-[#F6F6F7] text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            Toutes ({orders.length})
          </button>
          {ALL_STATUSES.map((st) => {
            const count = orders.filter((o) => o.status === st).length;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === st
                    ? 'bg-[#141413] text-white'
                    : 'bg-[#F6F6F7] text-[#5C5A55] hover:text-[#141413]'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8A877E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par numéro, client, téléphone ou produit..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg focus:border-[#2A4036] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date-desc' | 'date-asc' | 'total-desc')}
            className="px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg text-[#141413]"
          >
            <option value="date-desc">Plus récentes d’abord</option>
            <option value="date-asc">Plus anciennes d’abord</option>
            <option value="total-desc">Montant indicatif décroissant</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E3E3E6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3E3E6] bg-[#FAFAFA] text-[11px] font-semibold text-[#6B6860]">
                <th className="py-3 px-4">N° Commande</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Produits</th>
                <th className="py-3 px-4 text-right">Montant indicatif</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA] text-xs">
              {filtered.map((order) => {
                const st = getOrderStatusStyle(order.status);
                const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <tr
                    key={order.id}
                    onClick={() => openOrder(order)}
                    className="hover:bg-[#FAFAFA] cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-semibold tabular-nums text-[#141413]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#6B6860] whitespace-nowrap">
                      {formatDateTimeFr(order.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#141413]">
                      {order.customerFirstName} {order.customerLastName}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#5C5A55] whitespace-nowrap">
                      {order.customerPhone}
                    </td>
                    <td className="py-3 px-4 text-[#5C5A55]">
                      {totalQty} article{totalQty > 1 ? 's' : ''} ·{' '}
                      <span className="truncate">{order.items[0]?.productName}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-[#141413]">
                      {formatPrice(order.indicativeTotal, currencySymbol)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[11px] font-medium ${st.bg} ${st.text} ${st.border}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrder(order);
                        }}
                        className="text-xs font-semibold text-[#2A4036] hover:underline"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-[#5C5A55]">
                    Aucune commande ne correspond à votre filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => onSelectOrder(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-l border-[#E3E3E6] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E3E3E6] flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-[#6B6860] tabular-nums">
                  {selectedOrder.orderNumber} · {formatDateTimeFr(selectedOrder.createdAt)}
                </p>
                <h3 className="text-base font-semibold text-[#141413]">
                  {selectedOrder.customerFirstName} {selectedOrder.customerLastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectOrder(null)}
                aria-label="Fermer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5A55] hover:bg-[#F6F6F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer & Delivery Details */}
              <div className="bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl p-4 space-y-2 text-xs">
                <p className="font-semibold text-[#141413] text-sm">Coordonnées &amp; Livraison</p>
                <p>
                  <span className="text-[#6B6860]">Téléphone :</span>{' '}
                  <span className="font-mono text-[#141413]">{selectedOrder.customerPhone}</span>
                </p>
                {selectedOrder.customerEmail && (
                  <p>
                    <span className="text-[#6B6860]">Email :</span>{' '}
                    <span className="text-[#141413]">{selectedOrder.customerEmail}</span>
                  </p>
                )}
                <p>
                  <span className="text-[#6B6860]">Adresse / Zone :</span>{' '}
                  <span className="text-[#141413]">{selectedOrder.deliveryAddress}</span>
                </p>
                {selectedOrder.message && (
                  <div className="pt-2 border-t border-[#E6E4DF]">
                    <p className="text-[#6B6860]">Message du client :</p>
                    <p className="mt-1 text-[#141413] italic">« {selectedOrder.message} »</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-semibold text-[#141413] mb-3">
                  Produits demandés
                </h4>
                <div className="border border-[#E3E3E6] rounded-xl divide-y divide-[#F0EFEA]">
                  {selectedOrder.items.map((item) => (
                    <div key={item.productId} className="p-3 flex items-center gap-3">
                      <SafeImage
                        src={item.image}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#141413] truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] font-mono text-[#6B6860] tabular-nums">
                          Réf. {item.productRef} · {item.quantity} × {formatPrice(item.unitPrice, currencySymbol)}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-semibold tabular-nums text-[#141413]">
                        {formatPrice(item.unitPrice * item.quantity, currencySymbol)}
                      </span>
                    </div>
                  ))}
                  <div className="p-3 bg-[#FAFAFA] flex items-center justify-between text-xs font-semibold">
                    <span>Montant indicatif total</span>
                    <span className="font-mono tabular-nums text-[#141413]">
                      {formatPrice(selectedOrder.indicativeTotal, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Notes Update */}
              <div className="border border-[#E3E3E6] rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-semibold text-[#141413]">Traitement &amp; Statut</h4>
                <div>
                  <label className="block text-xs text-[#5C5A55] mb-1">Statut de la commande</label>
                  <select
                    value={pendingStatus}
                    onChange={(e) => setPendingStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {pendingStatus !== selectedOrder.status && (
                  <div>
                    <label className="block text-xs text-[#5C5A55] mb-1">
                      Commentaire d’historique (facultatif)
                    </label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Ex : Appel téléphonique effectué avec le client"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-[#5C5A55] mb-1">Notes internes</label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Notes privées d’atelier ou de suivi..."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg resize-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveOrder}
                  className="w-full py-2.5 px-4 bg-[#2A4036] hover:bg-[#20322A] disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>

              {/* Chronological History */}
              <div>
                <h4 className="text-xs font-semibold text-[#141413] mb-3">
                  Historique de la commande
                </h4>
                <div className="space-y-2.5">
                  {selectedOrder.history.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E3E3E6] text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#141413]">{entry.status}</span>
                        <span className="font-mono text-[11px] text-[#6B6860] tabular-nums">
                          {formatDateTimeFr(entry.date)}
                        </span>
                      </div>
                      <p className="text-[#5C5A55] mt-1">{entry.note}</p>
                      <p className="text-[11px] text-[#8A877E] mt-0.5">Par {entry.actor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
