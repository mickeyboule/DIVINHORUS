import { Copy, Eye, Mail, Pencil, Plus, Save, Send, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { formatAmountWithCurrency } from '../../lib/currency';
import type {
  InvoiceLineItem,
  InvoicePaymentStatus,
  MediaItem,
  Order,
  OrderInvoice,
  SiteSettings,
} from '../../types/cms';
import { InvoicePreview } from '../InvoicePreview';
import { SignatureEditor } from './SignatureEditor';

interface InvoiceModalProps {
  order: Order | null;
  settings: SiteSettings;
  media: MediaItem[];
  onMediaAdded: (item: MediaItem) => void;
  onSaved: (order: Order, updatedSettings?: SiteSettings) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
  onClose: () => void;
}

const PAYMENT_PRESETS = [
  'Mobile Money (Wave / Orange Money / MTN)',
  'Virement bancaire',
  'Lien de paiement en ligne',
  'Espèces à la remise',
];

function buildInitialInvoice(order: Order, settings: SiteSettings): OrderInvoice {
  if (order.invoice) {
    return {
      ...order.invoice,
      items: order.invoice.items.map((l) => ({ ...l })),
      signature: { ...order.invoice.signature },
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const items: InvoiceLineItem[] = order.items.map((i, idx) => ({
    id: `${i.productId}_${idx}`,
    description: i.productName,
    reference: i.productRef,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  }));
  const subtotal = Math.round(items.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 100) / 100;
  const shippingFee = typeof order.shippingFee === 'number' ? order.shippingFee : 0;
  const defaultSig = settings.orderSettings.defaultInvoiceSignature || {
    type: 'text' as const,
    imageUrl: '',
    signerName: settings.general.siteName,
    signerRole: 'Direction · Service Commandes',
  };

  return {
    invoiceNumber: order.orderNumber.replace(/^CMD-/, 'FAC-'),
    status: 'Brouillon',
    paymentStatus: 'En attente de paiement',
    issuedAt: today,
    dueDate: today,
    customerName: `${order.customerFirstName} ${order.customerLastName}`.trim(),
    customerEmail: order.customerEmail || '',
    customerPhone: order.customerPhone || '',
    customerAddress: order.deliveryAddress || '',
    customerCountry: order.customerCountry,
    currencyCode: settings.general.currencyCode || 'EUR',
    currencySymbol: settings.general.currencySymbol || '€',
    items,
    shippingFee,
    discount: 0,
    subtotal,
    total: Math.round((subtotal + shippingFee) * 100) / 100,
    paymentMethod:
      settings.orderSettings.defaultPaymentMethod || 'Mobile Money (Wave / Orange Money / MTN)',
    paymentDetails:
      settings.orderSettings.defaultPaymentDetails ||
      'Merci d’effectuer le règlement en précisant votre numéro de commande en référence.',
    notes:
      settings.orderSettings.defaultInvoiceNotes ||
      `${settings.general.siteName} · Merci pour votre confiance.`,
    signature: { ...defaultSig },
    sentAt: null,
    updatedAt: new Date().toISOString(),
  };
}

export function InvoiceModal({
  order,
  settings,
  media,
  onMediaAdded,
  onSaved,
  onNotify,
  onClose,
}: InvoiceModalProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [draft, setDraft] = useState<OrderInvoice | null>(null);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setDraft(buildInitialInvoice(order, settings));
      setMode('edit');
      setSaveAsDefault(false);
    } else {
      setDraft(null);
    }
  }, [order, settings]);

  if (!order || !draft) return null;

  const subtotal =
    Math.round(draft.items.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 100) / 100;
  const total = Math.max(
    0,
    Math.round((subtotal + draft.shippingFee - draft.discount) * 100) / 100,
  );
  const computedInvoice: OrderInvoice = {
    ...draft,
    subtotal,
    total,
  };

  const decimals = ['FCFA', 'CFA', 'FC', 'GNF', 'AR', 'HTG', 'DA'].includes(
    draft.currencySymbol.toUpperCase(),
  )
    ? 0
    : 2;

  const handlePersist = async (sendToClient: boolean) => {
    if (draft.items.length === 0) {
      onNotify('error', 'La facture doit contenir au moins une ligne.');
      return;
    }
    setSaving(true);
    try {
      const res = await adminApi.saveOrderInvoice(order.id, {
        ...computedInvoice,
        sendToClient,
        saveAsDefault,
      });
      onSaved(res.order, res.settings);
      onNotify(
        'success',
        sendToClient
          ? `Facture ${res.order.invoice?.invoiceNumber} et moyen de paiement envoyés au client.`
          : `Facture ${res.order.invoice?.invoiceNumber} enregistrée.`,
      );
      if (sendToClient) {
        onClose();
      }
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const trackingUrl = `${window.location.origin}/suivi-commande?num=${encodeURIComponent(
    order.orderNumber,
  )}&contact=${encodeURIComponent(order.customerEmail || order.customerPhone)}`;

  const mailtoSubject = `Facture ${computedInvoice.invoiceNumber} — Commande ${order.orderNumber} (${settings.general.siteName})`;
  const mailtoBody = [
    `Bonjour ${computedInvoice.customerName},`,
    '',
    `Suite à la confirmation de votre commande ${order.orderNumber}, veuillez trouver ci-dessous le récapitulatif de votre facture ${computedInvoice.invoiceNumber} :`,
    `Montant total à payer : ${formatAmountWithCurrency(total, draft.currencySymbol, decimals)}`,
    `Moyen de paiement : ${draft.paymentMethod}`,
    draft.paymentDetails ? `Instructions : ${draft.paymentDetails}` : '',
    '',
    `Consultez et imprimez votre facture complète en ligne : ${trackingUrl}`,
    '',
    `Cordialement,`,
    settings.general.siteName,
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      onNotify('success', 'Lien de suivi et facture copié dans le presse-papiers.');
    } catch {
      onNotify('error', 'Impossible de copier automatiquement le lien.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Facture commande ${order.orderNumber}`}
    >
      <div className="fixed inset-0 bg-black/50 no-print" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] bg-[#FAF9F6] border border-[#E3E3E6] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E3E3E6] flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#141413]">
                Facture &amp; Moyen de paiement · {order.orderNumber}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  draft.status === 'Envoyée'
                    ? 'bg-[#FBF6EA] text-[#7A5C12] border-[#E5D3A1]'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {draft.status === 'Envoyée' ? 'Envoyée au client' : 'Brouillon'}
              </span>
            </div>
            <p className="text-xs text-[#5C5A55] mt-0.5">
              Modifiez les lignes, précisez le moyen de paiement et ajoutez votre signature avant l’envoi au client.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-[#F6F6F7] border border-[#E3E3E6] rounded-lg">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${
                  mode === 'edit' ? 'bg-white text-[#141413] shadow-xs' : 'text-[#5C5A55]'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${
                  mode === 'preview' ? 'bg-white text-[#141413] shadow-xs' : 'text-[#5C5A55]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Aperçu &amp; PDF</span>
              </button>
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
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {mode === 'preview' ? (
            <InvoicePreview
              invoice={computedInvoice}
              orderNumber={order.orderNumber}
              settings={settings}
              showPrintButton
            />
          ) : (
            <div className="space-y-6 text-xs">
              {/* Top Meta + Client Info */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 bg-white border border-[#E3E3E6] rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-[#141413] text-sm">Informations facture</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#5C5A55] mb-1">N° Facture</label>
                      <input
                        type="text"
                        value={draft.invoiceNumber}
                        onChange={(e) => setDraft({ ...draft, invoiceNumber: e.target.value })}
                        className="w-full px-3 py-1.5 font-mono border border-[#D9D6CF] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#5C5A55] mb-1">
                        Symbole devise
                      </label>
                      <input
                        type="text"
                        value={draft.currencySymbol}
                        onChange={(e) => setDraft({ ...draft, currencySymbol: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#D9D6CF] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#5C5A55] mb-1">Date émission</label>
                      <input
                        type="date"
                        value={draft.issuedAt.slice(0, 10)}
                        onChange={(e) => setDraft({ ...draft, issuedAt: e.target.value })}
                        className="w-full px-3 py-1.5 font-mono border border-[#D9D6CF] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#5C5A55] mb-1">Échéance</label>
                      <input
                        type="date"
                        value={draft.dueDate.slice(0, 10)}
                        onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                        className="w-full px-3 py-1.5 font-mono border border-[#D9D6CF] rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#5C5A55] mb-1">
                      Statut du paiement
                    </label>
                    <select
                      value={draft.paymentStatus}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          paymentStatus: e.target.value as InvoicePaymentStatus,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-[#D9D6CF] rounded-lg"
                    >
                      <option value="En attente de paiement">En attente de paiement</option>
                      <option value="Partiellement payée">Partiellement payée</option>
                      <option value="Payée">Payée</option>
                    </select>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white border border-[#E3E3E6] rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-[#141413] text-sm">Coordonnées client (facturation)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#5C5A55] mb-1">Nom complet</label>
                      <input
                        type="text"
                        value={draft.customerName}
                        onChange={(e) => setDraft({ ...draft, customerName: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#D9D6CF] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#5C5A55] mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={draft.customerPhone}
                        onChange={(e) => setDraft({ ...draft, customerPhone: e.target.value })}
                        className="w-full px-3 py-1.5 font-mono border border-[#D9D6CF] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#5C5A55] mb-1">Email</label>
                      <input
                        type="email"
                        value={draft.customerEmail}
                        onChange={(e) => setDraft({ ...draft, customerEmail: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#D9D6CF] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#5C5A55] mb-1">Adresse</label>
                      <input
                        type="text"
                        value={draft.customerAddress}
                        onChange={(e) => setDraft({ ...draft, customerAddress: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#D9D6CF] rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Line Items */}
              <div className="bg-white border border-[#E3E3E6] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#141413] text-sm">
                    Produits &amp; Lignes facturées
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        items: [
                          ...draft.items,
                          {
                            id: `line_${Date.now()}`,
                            description: 'Prestation / Article',
                            reference: '',
                            quantity: 1,
                            unitPrice: 0,
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F6F7] hover:bg-[#EAEAE8] border border-[#D9D6CF] rounded-lg font-semibold text-[#141413]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E3E3E6] text-[11px] text-[#6B6860]">
                        <th className="py-2 pr-2">Désignation</th>
                        <th className="py-2 px-2 w-28">Réf.</th>
                        <th className="py-2 px-2 w-20 text-center">Qté</th>
                        <th className="py-2 px-2 w-32 text-right">
                          Prix unit. ({draft.currencySymbol})
                        </th>
                        <th className="py-2 pl-2 w-28 text-right">Total</th>
                        <th className="py-2 w-9" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFEA]">
                      {draft.items.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2 pr-2">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  items: draft.items.map((l) =>
                                    l.id === line.id ? { ...l, description: e.target.value } : l,
                                  ),
                                })
                              }
                              className="w-full px-2.5 py-1.5 border border-[#D9D6CF] rounded-md"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={line.reference || ''}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  items: draft.items.map((l) =>
                                    l.id === line.id ? { ...l, reference: e.target.value } : l,
                                  ),
                                })
                              }
                              className="w-full px-2 py-1.5 font-mono border border-[#D9D6CF] rounded-md"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  items: draft.items.map((l) =>
                                    l.id === line.id
                                      ? { ...l, quantity: Math.max(1, Number(e.target.value) || 1) }
                                      : l,
                                  ),
                                })
                              }
                              className="w-full px-2 py-1.5 text-center font-mono tabular-nums border border-[#D9D6CF] rounded-md"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={line.unitPrice}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  items: draft.items.map((l) =>
                                    l.id === line.id
                                      ? { ...l, unitPrice: Math.max(0, Number(e.target.value) || 0) }
                                      : l,
                                  ),
                                })
                              }
                              className="w-full px-2 py-1.5 text-right font-mono tabular-nums border border-[#D9D6CF] rounded-md"
                            />
                          </td>
                          <td className="py-2 pl-2 text-right font-mono tabular-nums font-semibold">
                            {formatAmountWithCurrency(
                              line.quantity * line.unitPrice,
                              draft.currencySymbol,
                              decimals,
                            )}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              disabled={draft.items.length <= 1}
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  items: draft.items.filter((l) => l.id !== line.id),
                                })
                              }
                              aria-label="Supprimer la ligne"
                              className="p-1 text-[#6B6860] hover:text-red-700 disabled:opacity-30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Shipping, Discount & Computed Total */}
                <div className="pt-3 border-t border-[#F0EFEA] grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[11px] text-[#5C5A55] mb-1">
                      Frais de livraison ({draft.currencySymbol})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={draft.shippingFee}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          shippingFee: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full px-3 py-1.5 font-mono tabular-nums border border-[#D9D6CF] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#5C5A55] mb-1">
                      Remise ({draft.currencySymbol})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={draft.discount}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          discount: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full px-3 py-1.5 font-mono tabular-nums border border-[#D9D6CF] rounded-lg"
                    />
                  </div>
                  <div className="bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#141413]">Total facture</span>
                    <span className="text-base font-mono font-semibold tabular-nums text-[#8F6B18]">
                      {formatAmountWithCurrency(total, draft.currencySymbol, decimals)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method & Instructions */}
              <div className="bg-white border border-[#E3E3E6] rounded-xl p-4 space-y-3">
                <p className="font-semibold text-[#141413] text-sm">
                  Moyen de paiement proposé au client
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDraft({ ...draft, paymentMethod: preset })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                        draft.paymentMethod === preset
                          ? 'bg-[#8F6B18] text-white border-[#8F6B18]'
                          : 'bg-[#FAF9F6] text-[#5C5A55] border-[#E3E3E6] hover:text-[#141413]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] text-[#5C5A55] mb-1">
                    Intitulé du moyen de paiement
                  </label>
                  <input
                    type="text"
                    value={draft.paymentMethod}
                    onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value })}
                    placeholder="Ex : Mobile Money (Wave / Orange Money) ou Virement bancaire"
                    className="w-full px-3 py-2 border border-[#D9D6CF] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#5C5A55] mb-1">
                    Coordonnées &amp; instructions de règlement (RIB/IBAN, numéro Mobile Money, lien de paiement...)
                  </label>
                  <textarea
                    rows={3}
                    value={draft.paymentDetails}
                    onChange={(e) => setDraft({ ...draft, paymentDetails: e.target.value })}
                    placeholder="Indiquez ici les coordonnées exactes permettant au client de régler sa facture..."
                    className="w-full px-3 py-2 border border-[#D9D6CF] rounded-lg resize-y"
                  />
                </div>
              </div>

              {/* Signature Editor */}
              <SignatureEditor
                value={draft.signature}
                media={media}
                onMediaAdded={onMediaAdded}
                onChange={(sig) => setDraft({ ...draft, signature: sig })}
              />

              {/* Footer Notes & Save Default */}
              <div className="bg-white border border-[#E3E3E6] rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#5C5A55] mb-1">
                    Notes &amp; mentions en bas de facture
                  </label>
                  <textarea
                    rows={2}
                    value={draft.notes}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9D6CF] rounded-lg resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                  />
                  <span className="text-[#141413] font-medium">
                    Enregistrer ce moyen de paiement et cette signature par défaut pour les prochaines factures
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-[#E3E3E6] flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#F6F6F7] hover:bg-[#EAEAE8] border border-[#D9D6CF] rounded-lg text-[#141413]"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copier lien client</span>
            </button>

            {computedInvoice.customerEmail && (
              <a
                href={`mailto:${encodeURIComponent(
                  computedInvoice.customerEmail,
                )}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(
                  mailtoBody,
                )}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#F6F6F7] hover:bg-[#EAEAE8] border border-[#D9D6CF] rounded-lg text-[#141413]"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Ouvrir par email</span>
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handlePersist(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white hover:bg-[#F6F6F7] border border-[#D9D6CF] text-[#141413] rounded-lg disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handlePersist(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#8F6B18] hover:bg-[#735613] text-white rounded-lg disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {saving
                  ? 'Envoi...'
                  : draft.status === 'Envoyée'
                    ? 'Mettre à jour & Renvoyer au client'
                    : 'Envoyer facture & paiement au client'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
