import { ArrowRight, CheckCircle2, Clock, PackageCheck, Search, UserCheck, XCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { SafeImage } from '../../components/SafeImage';
import { publicApi } from '../../lib/api';
import { formatDateTimeFr, formatPrice } from '../../lib/format';
import type { Order, OrderStatus, SiteSettings, VisitorMemberPublic } from '../../types/cms';

interface OrderTrackingPageProps {
  settings: SiteSettings;
  visitorUser: VisitorMemberPublic | null;
  initialOrderNumber?: string;
  initialContact?: string;
  onNavigate: (path: string) => void;
}

const PROGRESS_STEPS: Array<{ status: OrderStatus; label: string; description: string }> = [
  {
    status: 'Nouvelle',
    label: 'Demande reçue',
    description: 'Votre sélection a été transmise au Sanctuaire.',
  },
  {
    status: 'En cours',
    label: 'Vérification & échange',
    description: 'Notre équipe prépare votre demande et vérifie la disponibilité.',
  },
  {
    status: 'Confirmée',
    label: 'Confirmée',
    description: 'La préparation et les modalités de remise sont validées.',
  },
  {
    status: 'Terminée',
    label: 'Remise effectuée',
    description: 'Votre commande a été remise ou livrée.',
  },
];

export function OrderTrackingPage({
  settings,
  visitorUser,
  initialOrderNumber = '',
  initialContact = '',
  onNavigate,
}: OrderTrackingPageProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState(initialContact || visitorUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (initialOrderNumber && initialContact) {
      setLoading(true);
      publicApi
        .trackOrder(initialOrderNumber, initialContact)
        .then((res) => {
          setOrder(res.order);
          setError('');
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Commande introuvable.');
        })
        .finally(() => setLoading(false));
    }
  }, [initialOrderNumber, initialContact]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    if (!orderNumber.trim() || !contact.trim()) {
      setError('Veuillez saisir votre numéro de commande et votre email ou téléphone.');
      return;
    }
    setLoading(true);
    try {
      const res = await publicApi.trackOrder(orderNumber.trim(), contact.trim());
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aucune commande trouvée.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIdx = order
    ? PROGRESS_STEPS.findIndex((s) => s.status === order.status)
    : -1;

  return (
    <div className="bg-[#FAF9F6] min-h-[75vh] py-12 sm:py-16">
      <div className="max-w-[960px] mx-auto px-4 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#2A4036] tracking-wide">
            Suivi de commande
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#141413] tracking-tight">
            Où en est votre demande ?
          </h1>
          <p className="mt-3 text-base text-[#5C5A55] leading-relaxed">
            Consultez à tout moment l’avancement de votre commande grâce à votre référence (ex : CMD-1045) et à votre email ou numéro de téléphone.
          </p>
        </div>

        {/* Lookup Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-white border border-[#E6E4DF] rounded-xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#3F3E3A] mb-1.5">
                Numéro de commande
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Ex : CMD-1045"
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#FAF9F6] border border-[#D9D6CF] rounded-lg focus:bg-white focus:border-[#2A4036] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3F3E3A] mb-1.5">
                Email ou numéro de téléphone
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Ex : claire.morel@exemple.fr ou +33 6..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D9D6CF] rounded-lg focus:bg-white focus:border-[#2A4036] focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2A4036] hover:bg-[#20322A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Recherche...' : 'Consulter ma commande'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/mon-compte')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2A4036] hover:underline"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {visitorUser
                  ? 'Voir toutes mes commandes dans Mon compte'
                  : 'Vous avez un compte ? Voir toutes vos commandes'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Order Result */}
        {order && (
          <div className="mt-8 space-y-6">
            {/* Summary & Status */}
            <div className="bg-white border border-[#E6E4DF] rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFECE6]">
                <div>
                  <p className="text-xs font-mono tabular-nums text-[#5C5A55]">
                    Référence #{order.orderNumber} · Enregistrée le {formatDateTimeFr(order.createdAt)}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#141413]">
                    {order.customerFirstName} {order.customerLastName}
                  </h2>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[11px] text-[#6B6860]">Statut actuel</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#2A4036]">
                    {order.status}
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              {order.status === 'Annulée' ? (
                <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Demande annulée</p>
                    <p className="text-xs text-red-800 mt-0.5">
                      Cette demande de commande a été annulée. Contactez le Sanctuaire pour toute précision.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {PROGRESS_STEPS.map((step, idx) => {
                    const reached = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div
                        key={step.status}
                        className={`p-3.5 rounded-lg border transition-colors ${
                          isCurrent
                            ? 'bg-[#2A4036]/6 border-[#2A4036]'
                            : reached
                              ? 'bg-[#FAF9F6] border-[#D9D6CF]'
                              : 'bg-white border-[#EFECE6] opacity-55'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {reached ? (
                            <CheckCircle2 className="w-4 h-4 text-[#2A4036] shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-[#8A877E] shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-[#141413]">
                            {step.label}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#5C5A55] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Items & Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 bg-white border border-[#E6E4DF] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#141413] flex items-center gap-2 mb-4">
                  <PackageCheck className="w-4 h-4 text-[#2A4036]" />
                  <span>Objets demandés</span>
                </h3>
                <div className="divide-y divide-[#F0EFEA]">
                  {order.items.map((item) => (
                    <div key={item.productId} className="py-3 flex items-center gap-3.5">
                      <SafeImage
                        src={item.image}
                        alt={item.productName}
                        className="w-14 h-14 rounded-lg object-cover bg-[#F3F2EE] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#141413] truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-[#6B6860] font-mono tabular-nums mt-0.5">
                          Quantité : {item.quantity} × {formatPrice(item.unitPrice, settings.general.currencySymbol)}
                        </p>
                      </div>
                      <span className="text-sm font-mono tabular-nums font-semibold text-[#141413]">
                        {formatPrice(item.unitPrice * item.quantity, settings.general.currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#E6E4DF] flex items-center justify-between text-sm font-semibold">
                  <span>Total indicatif</span>
                  <span className="font-mono tabular-nums">
                    {formatPrice(order.indicativeTotal, settings.general.currencySymbol)}
                  </span>
                </div>
              </div>

              <div className="md:col-span-5 space-y-6">
                <div className="bg-white border border-[#E6E4DF] rounded-xl p-6 text-xs space-y-2">
                  <h3 className="text-sm font-semibold text-[#141413] mb-2">
                    Modalités enregistrées
                  </h3>
                  <p className="text-[#5C5A55]">
                    <strong className="text-[#141413]">Téléphone :</strong> {order.customerPhone}
                  </p>
                  {order.customerEmail && (
                    <p className="text-[#5C5A55]">
                      <strong className="text-[#141413]">Email :</strong> {order.customerEmail}
                    </p>
                  )}
                  <p className="text-[#5C5A55]">
                    <strong className="text-[#141413]">Livraison / Retrait :</strong>{' '}
                    {order.deliveryAddress}
                  </p>
                  {order.message && (
                    <p className="text-[#5C5A55] pt-2 border-t border-[#F0EFEA]">
                      <strong className="text-[#141413]">Votre message :</strong> {order.message}
                    </p>
                  )}
                </div>

                <div className="bg-white border border-[#E6E4DF] rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-[#141413] mb-3">
                    Historique chronologique
                  </h3>
                  <div className="space-y-3">
                    {order.history.map((entry, i) => (
                      <div key={i} className="text-xs border-b border-[#F0EFEA] last:border-0 pb-2.5 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#141413]">{entry.status}</span>
                          <span className="font-mono tabular-nums text-[11px] text-[#6B6860]">
                            {formatDateTimeFr(entry.date)}
                          </span>
                        </div>
                        <p className="text-[#5C5A55] mt-0.5">{entry.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
