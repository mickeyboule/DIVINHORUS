import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { publicApi } from '../lib/api';
import { formatPrice } from '../lib/format';
import type { Order, Product, SiteSettings, VisitorMemberPublic } from '../types/cms';
import { SafeImage } from './SafeImage';

export interface BasketItem {
  product: Product;
  quantity: number;
}

interface OrderDrawerProps {
  open: boolean;
  onClose: () => void;
  items: BasketItem[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearBasket: () => void;
  allProducts: Product[];
  onAddProduct: (product: Product) => void;
  settings: SiteSettings;
  visitorUser: VisitorMemberPublic | null;
  onNavigate: (path: string) => void;
  onOrderSuccess: (order: Order) => void;
}

export function OrderDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearBasket,
  allProducts,
  onAddProduct,
  settings,
  visitorUser,
  onNavigate,
  onOrderSuccess,
}: OrderDrawerProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (open && visitorUser) {
      setFirstName((prev) => prev || visitorUser.firstName);
      setLastName((prev) => prev || visitorUser.lastName);
      setPhone((prev) => prev || visitorUser.phone);
      setEmail((prev) => prev || visitorUser.email);
      setDeliveryAddress((prev) => prev || visitorUser.address);
    }
  }, [open, visitorUser]);

  if (!open) return null;

  const total = items.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  const availableToAdd = allProducts.filter(
    (p) => p.active && p.availability !== 'Rupture' && !items.some((i) => i.product.id === p.id),
  );

  const handleClose = () => {
    setConfirmedOrder(null);
    setError('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) {
      setError('Veuillez sélectionner au moins un produit.');
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !deliveryAddress.trim()) {
      setError('Merci de renseigner votre prénom, nom, téléphone et adresse de livraison.');
      return;
    }
    if (settings.orderSettings.requireEmail && !email.trim()) {
      setError('Votre adresse email est requise pour cette demande.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicApi.createOrder({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        deliveryAddress: deliveryAddress.trim(),
        message: message.trim(),
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      setConfirmedOrder(res.order);
      onClearBasket();
      onOrderSuccess(res.order);
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setDeliveryAddress('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Demande de commande">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-xl bg-[#FAF9F6] h-full shadow-2xl border-l border-[#E6E4DF] flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#E6E4DF] flex items-center justify-between bg-white">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#141413]">
              {confirmedOrder ? 'Demande enregistrée' : 'Demande de commande'}
            </h2>
            <p className="text-xs text-[#5C5A55] mt-0.5">
              Aucun paiement en ligne · Confirmation directe par notre équipe
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5C5A55] hover:bg-[#F3F2EE] hover:text-[#141413]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {confirmedOrder ? (
            <div className="bg-white border border-[#E6E4DF] rounded-xl p-6 space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#2A4036] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-[#5C5A55] tabular-nums">
                    Référence #{confirmedOrder.orderNumber}
                  </p>
                  <h3 className="text-lg font-semibold text-[#141413] mt-0.5">
                    Merci {confirmedOrder.customerFirstName}, votre demande est transmise
                  </h3>
                </div>
              </div>

              <p className="text-sm text-[#5C5A55] leading-relaxed">
                {settings.orderSettings.confirmationMessage}
              </p>

              <div className="border-t border-b border-[#E6E4DF] py-4 space-y-2.5">
                {confirmedOrder.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span className="text-[#141413]">
                      {item.quantity} × {item.productName}
                    </span>
                    <span className="font-mono tabular-nums text-[#5C5A55]">
                      {formatPrice(item.unitPrice * item.quantity, settings.general.currencySymbol)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-between text-sm font-semibold">
                  <span>Montant indicatif total</span>
                  <span className="font-mono tabular-nums text-[#141413]">
                    {formatPrice(confirmedOrder.indicativeTotal, settings.general.currencySymbol)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#5C5A55] space-y-1">
                <p>
                  <strong className="text-[#141413]">Téléphone :</strong> {confirmedOrder.customerPhone}
                </p>
                <p>
                  <strong className="text-[#141413]">Livraison :</strong> {confirmedOrder.deliveryAddress}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const ord = confirmedOrder;
                    const contact = ord.customerEmail || ord.customerPhone;
                    handleClose();
                    onNavigate(
                      `/suivi-commande?num=${encodeURIComponent(ord.orderNumber)}&contact=${encodeURIComponent(contact)}`,
                    );
                  }}
                  className="w-full py-2.5 px-4 bg-[#2A4036] text-white text-sm font-semibold rounded-lg hover:bg-[#20322A] transition-colors"
                >
                  Suivre l’état de ma commande
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 bg-white border border-[#D9D6CF] text-[#141413] text-sm font-medium rounded-lg hover:bg-[#FAF9F6] transition-colors"
                >
                  Poursuivre la visite
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#141413]">
                    Produits sélectionnés ({items.reduce((s, i) => s + i.quantity, 0)})
                  </h3>
                  {items.length > 0 && (
                    <span className="text-sm font-mono font-medium tabular-nums text-[#141413]">
                      Total indicatif : {formatPrice(total, settings.general.currencySymbol)}
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="bg-white border border-[#E6E4DF] rounded-xl p-6 text-center">
                    <ShoppingBag className="w-7 h-7 mx-auto text-[#8A877E] mb-2" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-[#141413]">
                      Aucun produit sélectionné pour le moment
                    </p>
                    <p className="text-xs text-[#5C5A55] mt-1">
                      Sélectionnez un objet ci-dessous ou depuis la boutique pour formuler votre demande.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3.5 bg-white border border-[#E6E4DF] rounded-xl p-3"
                      >
                        <SafeImage
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#141413] truncate">{product.name}</p>
                          <p className="text-xs font-mono tabular-nums text-[#5C5A55] mt-0.5">
                            {formatPrice(product.price, settings.general.currencySymbol)} / unité
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 border border-[#E6E4DF] rounded-lg px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, quantity - 1)}
                            aria-label="Diminuer la quantité"
                            className="w-7 h-7 flex items-center justify-center rounded text-[#5C5A55] hover:text-[#141413]"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-medium tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, quantity + 1)}
                            aria-label="Augmenter la quantité"
                            className="w-7 h-7 flex items-center justify-center rounded text-[#5C5A55] hover:text-[#141413]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          aria-label={`Retirer ${product.name}`}
                          className="p-2 text-[#8A877E] hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {settings.orderSettings.allowMultiProductCart && availableToAdd.length > 0 && (
                  <div className="mt-3">
                    <label htmlFor="quick-add-product" className="sr-only">
                      Ajouter un autre produit
                    </label>
                    <select
                      id="quick-add-product"
                      value=""
                      onChange={(e) => {
                        const prod = availableToAdd.find((p) => p.id === e.target.value);
                        if (prod) onAddProduct(prod);
                      }}
                      className="w-full text-xs bg-white border border-[#E6E4DF] rounded-lg px-3 py-2 text-[#5C5A55] focus:border-[#2A4036] focus:outline-none"
                    >
                      <option value="">+ Ajouter un autre produit à cette demande...</option>
                      {availableToAdd.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatPrice(p.price, settings.general.currencySymbol)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Order Request Form */}
              <form id="order-request-form" onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-[#E6E4DF]">
                <h3 className="text-sm font-semibold text-[#141413]">Vos coordonnées</h3>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      Prénom <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Claire"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      Nom <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Morel"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      Téléphone <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      Email {settings.orderSettings.requireEmail ? <span className="text-red-700">*</span> : '(facultatif)'}
                    </label>
                    <input
                      type="email"
                      required={settings.orderSettings.requireEmail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.fr"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                    Adresse ou zone de livraison <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ex : 14 Rue des Archives, 75004 Paris"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#6B6860] mt-1">
                    Zones desservies : {settings.orderSettings.deliveryZones}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                    Message ou précision (facultatif)
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Disponibilité horaire, demande particulière, mot de guidance..."
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none resize-none"
                  />
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sticky Footer Submit */}
        {!confirmedOrder && (
          <div className="px-6 py-4 border-t border-[#E6E4DF] bg-white">
            <button
              type="submit"
              form="order-request-form"
              disabled={submitting || items.length === 0}
              className="w-full py-3 px-4 bg-[#2A4036] text-white text-sm font-semibold rounded-lg hover:bg-[#20322A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Envoi de votre demande...' : 'Confirmer ma demande de commande'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
