import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { publicApi } from '../../lib/api';
import { formatDateTimeFr, getOrderStatusStyle } from '../../lib/format';
import type {
  OrderStatus,
  PublicOrderTrackingInfo,
  SiteSettings,
  VisitorMemberPublic,
} from '../../types/cms';

interface OrderTrackingPageProps {
  settings: SiteSettings;
  visitorUser: VisitorMemberPublic | null;
  initialOrderNumber?: string;
  initialContact?: string;
  onNavigate: (path: string) => void;
}

export function OrderTrackingPage({
  visitorUser,
  initialOrderNumber = '',
  initialContact = '',
  onNavigate,
}: OrderTrackingPageProps) {
  const { lang, t } = useLanguage();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState(initialContact || visitorUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<PublicOrderTrackingInfo | null>(null);

  const progressSteps: Array<{ status: OrderStatus; label: string; description: string }> = [
    {
      status: 'Nouvelle',
      label: t('tracking.stepNewLabel'),
      description: t('tracking.stepNewDesc'),
    },
    {
      status: 'En cours',
      label: t('tracking.stepInProgressLabel'),
      description: t('tracking.stepInProgressDesc'),
    },
    {
      status: 'Confirmée',
      label: t('tracking.stepConfirmedLabel'),
      description: t('tracking.stepConfirmedDesc'),
    },
    {
      status: 'En expédition',
      label: t('tracking.stepShippingLabel'),
      description: t('tracking.stepShippingDesc'),
    },
    {
      status: 'Terminée',
      label: t('tracking.stepCompletedLabel'),
      description: t('tracking.stepCompletedDesc'),
    },
  ];

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
          setError(err instanceof Error ? err.message : t('tracking.notFound'));
        })
        .finally(() => setLoading(false));
    }
  }, [initialOrderNumber, initialContact, t]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    if (!orderNumber.trim() || !contact.trim()) {
      setError(t('tracking.missingFields'));
      return;
    }
    setLoading(true);
    try {
      const res = await publicApi.trackOrder(orderNumber.trim(), contact.trim());
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tracking.notFound'));
    } finally {
      setLoading(false);
    }
  };

  const currentStepIdx = order
    ? progressSteps.findIndex((s) => s.status === order.status)
    : -1;
  const statusStyle = order ? getOrderStatusStyle(order.status, lang) : null;

  return (
    <div className="bg-[#FAF9F6] min-h-[75vh] py-12 sm:py-16">
      <div className="max-w-[960px] mx-auto px-4 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#2A4036] tracking-wide">
            {t('tracking.kicker')}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#141413] tracking-tight">
            {t('tracking.title')}
          </h1>
          <p className="mt-3 text-base text-[#5C5A55] leading-relaxed">
            {t('tracking.subtitle')}
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
                {t('tracking.orderNumberLabel')}
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder={t('tracking.orderNumberPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#FAF9F6] border border-[#D9D6CF] rounded-lg focus:bg-white focus:border-[#2A4036] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3F3E3A] mb-1.5">
                {t('tracking.contactLabel')}
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t('tracking.contactPlaceholder')}
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
              <span>{loading ? t('tracking.searching') : t('tracking.submit')}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/mon-compte')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2A4036] hover:underline"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {visitorUser ? t('tracking.viewAccountOrders') : t('tracking.haveAccount')}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Order Status Result (Status & Progress Only) */}
        {order && (
          <div className="mt-8 space-y-6">
            <div className="bg-white border border-[#E6E4DF] rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFECE6]">
                <div>
                  <p className="text-xs font-mono tabular-nums text-[#5C5A55]">
                    {t('tracking.registeredAt', {
                      orderNumber: order.orderNumber,
                      date: formatDateTimeFr(order.createdAt, lang),
                    })}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#141413]">
                    {order.customerFirstName} {order.customerLastName}
                  </h2>
                  <p className="mt-1 text-[11px] font-mono tabular-nums text-[#6B6860]">
                    {t('tracking.lastUpdate', {
                      date: formatDateTimeFr(order.updatedAt, lang),
                    })}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[11px] text-[#6B6860] mb-1">{t('tracking.currentStatus')}</p>
                  {statusStyle && (
                    <span
                      className={`inline-block px-3 py-1 rounded-md border text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {statusStyle.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Steps */}
              {order.status === 'Annulée' ? (
                <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      {t('tracking.cancelledTitle')}
                    </p>
                    <p className="text-xs text-red-800 mt-0.5">{t('tracking.cancelledDesc')}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {progressSteps.map((step, idx) => {
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

            {/* Chronological Status History Only */}
            <div className="bg-white border border-[#E6E4DF] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#141413] mb-3">
                {t('tracking.historyTitle')}
              </h3>
              <div className="space-y-3">
                {order.history.map((entry, i) => (
                  <div
                    key={i}
                    className="text-xs border-b border-[#F0EFEA] last:border-0 pb-2.5 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#141413]">
                        {getOrderStatusStyle(entry.status, lang).label}
                      </span>
                      <span className="font-mono tabular-nums text-[11px] text-[#6B6860]">
                        {formatDateTimeFr(entry.date, lang)}
                      </span>
                    </div>
                    <p className="text-[#5C5A55] mt-0.5">{entry.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
