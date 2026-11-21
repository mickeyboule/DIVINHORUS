import { Plus, Save, Search, Trash2, UserCheck, Users, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { CountrySelect } from '../../components/CountrySelect';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { adminApi } from '../../lib/api';
import { formatCountryWithFlag } from '../../lib/countries';
import { formatDateTimeFr, formatPrice, getOrderStatusStyle } from '../../lib/format';
import type { Customer, Order, VisitorMemberPublic } from '../../types/cms';

interface AdminCustomersViewProps {
  customers: Customer[];
  visitors?: VisitorMemberPublic[];
  orders: Order[];
  currencySymbol: string;
  onCustomerCreated: (cust: Customer) => void;
  onCustomerUpdated: (cust: Customer) => void;
  onCustomerDeleted: (id: string) => void;
  onInspectOrder: (orderId: string) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

interface CustomerFormDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  address: string;
  notes: string;
}

const EMPTY_CUSTOMER_FORM: CustomerFormDraft = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  country: '',
  address: '',
  notes: '',
};

export function AdminCustomersView({
  customers,
  visitors = [],
  orders,
  currencySymbol,
  onCustomerCreated,
  onCustomerUpdated,
  onCustomerDeleted,
  onInspectOrder,
  onNotify,
}: AdminCustomersViewProps) {
  const [viewTab, setViewTab] = useState<'customers' | 'visitors'>('customers');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CustomerFormDraft>(EMPTY_CUSTOMER_FORM);
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<CustomerFormDraft>(EMPTY_CUSTOMER_FORM);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedId) || null;
  const customerOrders = selectedCustomer
    ? orders.filter((o) => o.customerId === selectedCustomer.id)
    : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.phone} ${c.email} ${c.country || ''} ${formatCountryWithFlag(c.country)} ${c.address}`
        .toLowerCase()
        .includes(q),
    );
  }, [customers, search]);

  const filteredVisitors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter((v) =>
      `${v.firstName} ${v.lastName} ${v.phone} ${v.email} ${v.country || ''} ${formatCountryWithFlag(v.country)} ${v.address}`
        .toLowerCase()
        .includes(q),
    );
  }, [visitors, search]);

  const countOrdersForVisitor = (v: VisitorMemberPublic): number => {
    const normEmail = v.email.toLowerCase();
    const normPhone = v.phone.replace(/\s+/g, '');
    return orders.filter(
      (o) =>
        o.visitorId === v.id ||
        (o.customerEmail && o.customerEmail.toLowerCase() === normEmail) ||
        (normPhone && o.customerPhone.replace(/\s+/g, '') === normPhone),
    ).length;
  };

  const openCustomer = (c: Customer) => {
    setSelectedId(c.id);
    setEditDraft({
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      phone: c.phone || '',
      email: c.email || '',
      country: c.country || '',
      address: c.address || '',
      notes: c.notes || '',
    });
  };

  const handleSaveCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      const res = await adminApi.updateCustomer(selectedCustomer.id, {
        firstName: editDraft.firstName,
        lastName: editDraft.lastName,
        phone: editDraft.phone,
        email: editDraft.email,
        country: editDraft.country,
        address: editDraft.address,
        notes: editDraft.notes,
      });
      onCustomerUpdated(res.customer);
      onNotify('success', 'Fiche client enregistrée.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomer = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await adminApi.createCustomer(createDraft);
      onCustomerCreated(res.customer);
      setCreateDraft(EMPTY_CUSTOMER_FORM);
      setCreateOpen(false);
      setViewTab('customers');
      onNotify('success', `Client « ${res.customer.firstName} ${res.customer.lastName} » ajouté.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCustomer(deleteTarget.id);
      onCustomerDeleted(deleteTarget.id);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      onNotify('success', `Client « ${deleteTarget.firstName} ${deleteTarget.lastName} » supprimé.`);
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Clients &amp; Membres inscrits</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Annuaire des clients, ajout manuel de fiches clients et comptes membres enregistrés sur la boutique.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#8A877E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                viewTab === 'customers' ? 'Rechercher un client...' : 'Rechercher un compte inscrit...'
              }
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E3E3E6] rounded-lg focus:border-[#8F6B18] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateDraft(EMPTY_CUSTOMER_FORM);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8F6B18] hover:bg-[#735613] text-white text-xs font-semibold rounded-lg whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un client</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setViewTab('customers')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            viewTab === 'customers'
              ? 'bg-[#8F6B18] text-white'
              : 'bg-white border border-[#E3E3E6] text-[#5C5A55] hover:text-[#141413]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Clients ({customers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setViewTab('visitors')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            viewTab === 'visitors'
              ? 'bg-[#8F6B18] text-white'
              : 'bg-white border border-[#E3E3E6] text-[#5C5A55] hover:text-[#141413]'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Comptes inscrits ({visitors.length})</span>
        </button>
      </div>

      {viewTab === 'customers' ? (
        <div className="bg-white border border-[#E3E3E6] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3E3E6] bg-[#FAFAFA] text-[11px] font-semibold text-[#6B6860]">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Pays</th>
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
                    <td className="py-3 px-4 text-[#141413] whitespace-nowrap">
                      {formatCountryWithFlag(cust.country)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#5C5A55]">
                      {cust.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#5C5A55]">{cust.email || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#141413]">
                      {cust.orderCount}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#6B6860] whitespace-nowrap">
                      {cust.lastOrderAt ? formatDateTimeFr(cust.lastOrderAt) : '—'}
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
                        className="text-xs font-semibold text-[#8F6B18] hover:underline"
                      >
                        Fiche client
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-[#5C5A55]">
                      Aucun client trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E3E3E6] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3E3E6] bg-[#FAFAFA] text-[11px] font-semibold text-[#6B6860]">
                  <th className="py-3 px-4">Membre</th>
                  <th className="py-3 px-4">Pays</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Adresse enregistrée</th>
                  <th className="py-3 px-4 text-right">Commandes</th>
                  <th className="py-3 px-4">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA] text-xs">
                {filteredVisitors.map((vis) => (
                  <tr key={vis.id} className="hover:bg-[#FAFAFA]">
                    <td className="py-3 px-4 font-semibold text-[#141413]">
                      {vis.firstName} {vis.lastName}
                    </td>
                    <td className="py-3 px-4 text-[#141413] whitespace-nowrap">
                      {formatCountryWithFlag(vis.country)}
                    </td>
                    <td className="py-3 px-4 text-[#5C5A55]">{vis.email}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#5C5A55]">
                      {vis.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#5C5A55] max-w-[260px] truncate">
                      {vis.address || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#141413]">
                      {countOrdersForVisitor(vis)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#6B6860] whitespace-nowrap">
                      {formatDateTimeFr(vis.createdAt)}
                    </td>
                  </tr>
                ))}
                {filteredVisitors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-[#5C5A55]">
                      Aucun compte visiteur inscrit ne correspond à votre recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Ajouter un client"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setCreateOpen(false)}
            aria-hidden="true"
          />
          <form
            onSubmit={handleCreateCustomer}
            className="relative z-10 w-full max-w-lg bg-white border border-[#E3E3E6] rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E3E3E6] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#141413]">Ajouter un client</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                aria-label="Fermer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5A55] hover:bg-[#F6F6F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={createDraft.firstName}
                    onChange={(e) => setCreateDraft({ ...createDraft, firstName: e.target.value })}
                    placeholder="Prénom du client"
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={createDraft.lastName}
                    onChange={(e) => setCreateDraft({ ...createDraft, lastName: e.target.value })}
                    placeholder="Nom du client"
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={createDraft.phone}
                    onChange={(e) => setCreateDraft({ ...createDraft, phone: e.target.value })}
                    placeholder="+225 07..."
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Email</label>
                  <input
                    type="email"
                    value={createDraft.email}
                    onChange={(e) => setCreateDraft({ ...createDraft, email: e.target.value })}
                    placeholder="client@exemple.com"
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Pays</label>
                <CountrySelect
                  value={createDraft.country}
                  onChange={(code) => setCreateDraft({ ...createDraft, country: code })}
                />
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Adresse habituelle</label>
                <input
                  type="text"
                  value={createDraft.address}
                  onChange={(e) => setCreateDraft({ ...createDraft, address: e.target.value })}
                  placeholder="Rue, quartier, ville..."
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={createDraft.notes}
                  onChange={(e) => setCreateDraft({ ...createDraft, notes: e.target.value })}
                  placeholder="Préférences, suivi individuel..."
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E3E3E6] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#5C5A55] bg-white border border-[#D9D6CF] rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{creating ? 'Enregistrement...' : 'Enregistrer le client'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

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
              <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#3F3E3A] mb-1">Prénom</label>
                    <input
                      type="text"
                      required
                      value={editDraft.firstName}
                      onChange={(e) => setEditDraft({ ...editDraft, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#3F3E3A] mb-1">Nom</label>
                    <input
                      type="text"
                      required
                      value={editDraft.lastName}
                      onChange={(e) => setEditDraft({ ...editDraft, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#3F3E3A] mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={editDraft.phone}
                      onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#D9D6CF] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#3F3E3A] mb-1">Email</label>
                    <input
                      type="email"
                      value={editDraft.email}
                      onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Pays</label>
                  <CountrySelect
                    value={editDraft.country}
                    onChange={(code) => setEditDraft({ ...editDraft, country: code })}
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">
                    Adresse habituelle
                  </label>
                  <input
                    type="text"
                    value={editDraft.address}
                    onChange={(e) => setEditDraft({ ...editDraft, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#141413] mb-1">
                    Notes sur le client
                  </label>
                  <textarea
                    rows={3}
                    value={editDraft.notes}
                    onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                    placeholder="Préférences de livraison, accompagnement..."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Enregistrement...' : 'Enregistrer la fiche client'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selectedCustomer)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </form>

              <div>
                <h4 className="text-xs font-semibold text-[#141413] mb-3">
                  Historique des commandes ({customerOrders.length})
                </h4>
                {customerOrders.length === 0 ? (
                  <p className="text-xs text-[#6B6860] italic">
                    Aucune commande enregistrée pour ce client pour le moment.
                  </p>
                ) : (
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
                            className="text-xs font-semibold text-[#8F6B18] hover:underline shrink-0"
                          >
                            Ouvrir
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer ce client ?"
        description={`La fiche de « ${deleteTarget?.firstName} ${deleteTarget?.lastName} » sera retirée de l’annuaire.`}
        confirmLabel="Supprimer"
        onConfirm={handleDeleteCustomer}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
