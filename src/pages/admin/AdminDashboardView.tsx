import { ArrowRight, Download, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatDateTimeFr, formatPrice, getOrderStatusStyle } from '../../lib/format';
import type { AdminBootstrapData, AdminUserPublic, OrderStatus } from '../../types/cms';
import type { AdminSection } from './AdminLayout';

interface AdminDashboardViewProps {
  data: AdminBootstrapData;
  adminUser: AdminUserPublic;
  onNavigateSection: (sec: AdminSection) => void;
  onInspectOrder: (orderId: string) => void;
}

type PeriodKey = '7d' | '14d' | '30d' | 'all';
type ChartMetric = 'revenue' | 'count';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  '7d': '7 jours',
  '14d': '14 jours',
  '30d': '30 jours',
  all: 'Tout',
};

const ORDER_STATUSES: OrderStatus[] = [
  'Nouvelle',
  'En cours',
  'Confirmée',
  'En expédition',
  'Terminée',
  'Annulée',
];

export function AdminDashboardView({
  data,
  adminUser,
  onNavigateSection,
  onInspectOrder,
}: AdminDashboardViewProps) {
  const {
    orders,
    products,
    categories,
    customers,
    articles,
    videos,
    testimonials,
    visitors,
    contactMessages,
    activities,
    settings,
  } = data;

  const currency = settings.general.currencySymbol;
  const [period, setPeriod] = useState<PeriodKey>('14d');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue');
  const [hoveredBarKey, setHoveredBarKey] = useState<string | null>(null);

  const periodDays = period === '7d' ? 7 : period === '14d' ? 14 : period === '30d' ? 30 : 30;

  const periodOrders = useMemo(() => {
    if (period === 'all') return orders;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (periodDays - 1));
    const cutoffMs = cutoff.getTime();
    return orders.filter((o) => new Date(o.createdAt).getTime() >= cutoffMs);
  }, [orders, period, periodDays]);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const ordersToday = orders.filter((o) => o.createdAt.slice(0, 10) === todayStr).length;
    const pendingOrders = orders.filter((o) => o.status === 'Nouvelle' || o.status === 'En cours').length;
    const newOrders = orders.filter((o) => o.status === 'Nouvelle').length;

    const validPeriodOrders = periodOrders.filter((o) => o.status !== 'Annulée');
    const totalRevenue = validPeriodOrders.reduce((s, o) => s + o.indicativeTotal, 0);
    const confirmedRevenue = periodOrders
      .filter(
        (o) =>
          o.status === 'Confirmée' || o.status === 'En expédition' || o.status === 'Terminée',
      )
      .reduce((s, o) => s + o.indicativeTotal, 0);
    const completedOrConfirmedCount = periodOrders.filter(
      (o) =>
        o.status === 'Confirmée' || o.status === 'En expédition' || o.status === 'Terminée',
    ).length;
    const avgBasket =
      validPeriodOrders.length > 0 ? totalRevenue / validPeriodOrders.length : 0;
    const confirmationRate =
      validPeriodOrders.length > 0
        ? Math.round((completedOrConfirmedCount / validPeriodOrders.length) * 100)
        : 0;

    const activeProducts = products.filter((p) => p.active).length;
    const lowOrOutStock = products.filter(
      (p) => p.active && (p.availability === 'Rupture' || (p.stockCount > 0 && p.stockCount <= 5)),
    ).length;

    const publishedArticles = articles.filter((a) => a.status === 'Publié');
    const totalLikes = articles.reduce((s, a) => s + (a.likesCount || 0), 0);
    const topArticle = [...publishedArticles].sort(
      (a, b) => (b.likesCount || 0) - (a.likesCount || 0),
    )[0];

    const visibleVideos = videos.filter((v) => v.visible).length;
    const publishedTestimonials = testimonials.filter((t) => t.status === 'Publié');
    const avgRating =
      publishedTestimonials.length > 0
        ? (
            publishedTestimonials.reduce((s, t) => s + (t.rating || 5), 0) /
            publishedTestimonials.length
          ).toFixed(1)
        : '—';
    const unreadMessages = contactMessages.filter((m) => !m.read).length;

    return {
      ordersToday,
      pendingOrders,
      newOrders,
      totalRevenue,
      confirmedRevenue,
      validCount: validPeriodOrders.length,
      avgBasket,
      confirmationRate,
      activeProducts,
      lowOrOutStock,
      publishedArticlesCount: publishedArticles.length,
      totalLikes,
      topArticle,
      visibleVideos,
      publishedTestimonialsCount: publishedTestimonials.length,
      avgRating,
      unreadMessages,
    };
  }, [orders, periodOrders, products, articles, videos, testimonials, contactMessages]);

  // Daily series for chart (7, 14, or 30 days)
  const chartDays = useMemo(() => {
    const countDays = period === '7d' ? 7 : period === '14d' ? 14 : 30;
    return Array.from({ length: countDays }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (countDays - 1 - idx));
      const key = d.toISOString().slice(0, 10);
      const shortLabel = new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      }).format(d);
      const longLabel = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(d);
      const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === key && o.status !== 'Annulée');
      const allDayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === key);
      return {
        key,
        shortLabel,
        longLabel,
        count: allDayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.indicativeTotal, 0),
      };
    });
  }, [orders, period]);

  const maxChartValue = useMemo(() => {
    if (chartMetric === 'revenue') {
      return Math.max(1, ...chartDays.map((d) => d.revenue));
    }
    return Math.max(2, ...chartDays.map((d) => d.count));
  }, [chartDays, chartMetric]);

  const bestDay = useMemo(() => {
    return [...chartDays].sort((a, b) =>
      chartMetric === 'revenue' ? b.revenue - a.revenue : b.count - a.count,
    )[0];
  }, [chartDays, chartMetric]);

  // Status breakdown for selected period
  const statusBreakdown = useMemo(() => {
    return ORDER_STATUSES.map((status) => {
      const matching = periodOrders.filter((o) => o.status === status);
      return {
        status,
        count: matching.length,
        amount: matching.reduce((s, o) => s + o.indicativeTotal, 0),
        style: getOrderStatusStyle(status),
      };
    });
  }, [periodOrders]);

  // Product & Category performance computed from non-cancelled period orders
  const productPerformance = useMemo(() => {
    const map = new Map<string, { units: number; revenue: number }>();
    periodOrders
      .filter((o) => o.status !== 'Annulée')
      .forEach((ord) => {
        ord.items.forEach((item) => {
          const prev = map.get(item.productId) || { units: 0, revenue: 0 };
          map.set(item.productId, {
            units: prev.units + item.quantity,
            revenue: prev.revenue + item.unitPrice * item.quantity,
          });
        });
      });

    return [...products]
      .map((p) => {
        const perf = map.get(p.id);
        return {
          product: p,
          units: perf ? perf.units : period === 'all' ? p.orderCount : 0,
          revenue: perf ? perf.revenue : period === 'all' ? p.orderCount * p.price : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
      .slice(0, 5);
  }, [products, periodOrders, period]);

  const categoryPerformance = useMemo(() => {
    const prodToCat = new Map(products.map((p) => [p.id, p.categoryId]));
    const totals = new Map<string, { units: number; revenue: number }>();

    periodOrders
      .filter((o) => o.status !== 'Annulée')
      .forEach((ord) => {
        ord.items.forEach((item) => {
          const catId = prodToCat.get(item.productId) || 'other';
          const prev = totals.get(catId) || { units: 0, revenue: 0 };
          totals.set(catId, {
            units: prev.units + item.quantity,
            revenue: prev.revenue + item.unitPrice * item.quantity,
          });
        });
      });

    const rows = categories.map((cat) => {
      const perf = totals.get(cat.id) || { units: 0, revenue: 0 };
      const prodCount = products.filter((p) => p.categoryId === cat.id && p.active).length;
      return {
        id: cat.id,
        name: cat.name,
        prodCount,
        units: perf.units,
        revenue: perf.revenue,
      };
    });

    const maxRev = Math.max(1, ...rows.map((r) => r.revenue));
    return rows
      .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
      .map((r) => ({
        ...r,
        pctOfTop: Math.round((r.revenue / maxRev) * 100),
      }));
  }, [categories, products, periodOrders]);

  const handleExportCsv = () => {
    const header = [
      'Numero',
      'Date',
      'Client',
      'Telephone',
      'Email',
      'Statut',
      `Montant (${currency})`,
      'Produits',
    ];
    const rows = periodOrders.map((o) => [
      o.orderNumber,
      o.createdAt,
      `${o.customerFirstName} ${o.customerLastName}`,
      o.customerPhone,
      o.customerEmail,
      o.status,
      String(o.indicativeTotal),
      o.items.map((i) => `${i.quantity}x ${i.productName}`).join(' | '),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistiques-commandes-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hoveredDay = chartDays.find((d) => d.key === hoveredBarKey) || null;

  return (
    <div className="space-y-6">
      {/* Top Bar: Greeting, Period Filter, Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#141413]">
            Tableau de bord &amp; Statistiques
          </h2>
          <p className="text-sm text-[#5C5A55] mt-0.5">
            Bonjour {adminUser.name} · Indicateurs de performance boutique, commandes et communauté.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter Segmented Control */}
          <div
            role="tablist"
            aria-label="Période d’analyse"
            className="inline-flex items-center p-1 bg-white border border-[#E3E3E6] rounded-lg"
          >
            {(['7d', '14d', '30d', 'all'] as PeriodKey[]).map((key) => {
              const active = period === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPeriod(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#2A4036] text-white'
                      : 'text-[#5C5A55] hover:text-[#141413]'
                  }`}
                >
                  {PERIOD_LABELS[key]}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-[#D9D6CF] text-[#141413] rounded-lg hover:bg-[#F7F7F8] whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateSection('products')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#2A4036] text-white rounded-lg hover:bg-[#20322A] whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un produit</span>
          </button>
        </div>
      </div>

      {/* Primary 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateSection('orders')}
          className="bg-white border border-[#E3E3E6] rounded-xl p-5 text-left hover:border-[#2A4036] transition-colors"
        >
          <p className="text-xs font-medium text-[#5C5A55]">
            Volume indicatif ({PERIOD_LABELS[period]})
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold tabular-nums text-[#141413]">
            {formatPrice(stats.totalRevenue, currency)}
          </p>
          <p className="mt-2 text-xs text-[#6B6860] font-mono tabular-nums">
            Dont {formatPrice(stats.confirmedRevenue, currency)} confirmé / terminé
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection('orders')}
          className="bg-white border border-[#E3E3E6] rounded-xl p-5 text-left hover:border-[#2A4036] transition-colors"
        >
          <p className="text-xs font-medium text-[#5C5A55]">
            Demandes de commande ({PERIOD_LABELS[period]})
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold tabular-nums text-[#141413]">
            {periodOrders.length}
          </p>
          <p className="mt-2 text-xs text-[#6B6860] font-mono tabular-nums">
            {stats.newOrders} nouvelle{stats.newOrders > 1 ? 's' : ''} · {stats.pendingOrders} en attente ·{' '}
            {stats.ordersToday} aujourd’hui
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection('customers')}
          className="bg-white border border-[#E3E3E6] rounded-xl p-5 text-left hover:border-[#2A4036] transition-colors"
        >
          <p className="text-xs font-medium text-[#5C5A55]">
            Panier moyen &amp; confirmation
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold tabular-nums text-[#141413]">
            {formatPrice(Math.round(stats.avgBasket), currency)}
          </p>
          <p className="mt-2 text-xs text-[#6B6860] font-mono tabular-nums">
            Taux de confirmation : {stats.confirmationRate}% · {customers.length} clients
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection('articles')}
          className="bg-white border border-[#E3E3E6] rounded-xl p-5 text-left hover:border-[#2A4036] transition-colors"
        >
          <p className="text-xs font-medium text-[#5C5A55]">
            Audience &amp; Communauté
          </p>
          <p className="mt-2 text-2xl font-mono font-semibold tabular-nums text-[#141413]">
            {visitors.length} membres
          </p>
          <p className="mt-2 text-xs text-[#6B6860] font-mono tabular-nums">
            {stats.totalLikes} j’aime · Note {stats.avgRating}/5 · {stats.unreadMessages} msg non lu
            {stats.unreadMessages > 1 ? 's' : ''}
          </p>
        </button>
      </div>

      {/* Main Analytics Row: Evolution Chart + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Evolution Bar Chart */}
        <div className="lg:col-span-8 bg-white border border-[#E3E3E6] rounded-xl p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-sm font-semibold text-[#141413]">
                Évolution journalière ({period === 'all' ? '30 derniers jours' : PERIOD_LABELS[period]})
              </h3>
              <p className="text-xs text-[#6B6860] mt-0.5 font-mono tabular-nums">
                {hoveredDay
                  ? `${hoveredDay.longLabel} : ${hoveredDay.count} commande(s) · ${formatPrice(
                      hoveredDay.revenue,
                      currency,
                    )}`
                  : bestDay
                  ? `Pic d’activité : ${bestDay.longLabel} (${bestDay.count} dem. · ${formatPrice(
                      bestDay.revenue,
                      currency,
                    )})`
                  : 'Survolez une barre pour voir le détail journalier'}
              </p>
            </div>

            <div className="inline-flex items-center p-1 bg-[#F6F6F7] border border-[#E3E3E6] rounded-lg self-start">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-[#141413] shadow-xs'
                    : 'text-[#5C5A55] hover:text-[#141413]'
                }`}
              >
                Montants ({currency})
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('count')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  chartMetric === 'count'
                    ? 'bg-white text-[#141413] shadow-xs'
                    : 'text-[#5C5A55] hover:text-[#141413]'
                }`}
              >
                Commandes
              </button>
            </div>
          </div>

          {/* Chart Canvas with Y-axis Gridlines */}
          <div className="relative h-52 flex items-end gap-1.5 sm:gap-2 pt-6 pb-1 border-b border-[#E3E3E6]">
            {/* Horizontal guidelines */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-6 bottom-1 flex flex-col justify-between pointer-events-none"
            >
              <div className="border-t border-dashed border-[#EFECE6]" />
              <div className="border-t border-dashed border-[#EFECE6]" />
              <div className="border-t border-dashed border-[#EFECE6]" />
            </div>

            {chartDays.map((d) => {
              const val = chartMetric === 'revenue' ? d.revenue : d.count;
              const heightPct = val > 0 ? Math.max(8, Math.round((val / maxChartValue) * 100)) : 4;
              const isHovered = hoveredBarKey === d.key;
              return (
                <div
                  key={d.key}
                  onMouseEnter={() => setHoveredBarKey(d.key)}
                  onMouseLeave={() => setHoveredBarKey(null)}
                  className="relative z-10 flex-1 h-full flex flex-col justify-end items-center min-w-0 group cursor-pointer"
                >
                  {val > 0 && (
                    <span className="mb-1 text-[10px] font-mono tabular-nums text-[#3F3E3A] truncate max-w-full hidden sm:block">
                      {chartMetric === 'revenue'
                        ? chartDays.length <= 14
                          ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(val)
                          : ''
                        : val}
                    </span>
                  )}
                  <div className="w-full flex-1 flex items-end">
                    <div
                      title={`${d.longLabel} : ${d.count} commande(s) · ${formatPrice(d.revenue, currency)}`}
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-colors ${
                        val > 0
                          ? isHovered
                            ? 'bg-[#1D2D26]'
                            : 'bg-[#2A4036]'
                          : isHovered
                          ? 'bg-[#DEDAD0]'
                          : 'bg-[#EFECE6]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis Labels */}
          <div className="mt-2 flex items-center gap-1.5 sm:gap-2">
            {chartDays.map((d, idx) => {
              const showLabel =
                chartDays.length <= 14 || idx === 0 || idx === chartDays.length - 1 || idx % 5 === 0;
              return (
                <span
                  key={d.key}
                  className="flex-1 text-[10px] font-mono tabular-nums text-[#6B6860] text-center truncate"
                >
                  {showLabel ? d.shortLabel : ''}
                </span>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="lg:col-span-4 bg-white border border-[#E3E3E6] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#141413]">Répartition par statut</h3>
              <span className="text-xs font-mono tabular-nums text-[#6B6860]">
                {periodOrders.length} total
              </span>
            </div>
            <p className="text-xs text-[#6B6860] mt-0.5 mb-5">
              Suivi des demandes sur la période sélectionnée
            </p>

            <div className="space-y-4">
              {statusBreakdown.map((row) => {
                const pct =
                  periodOrders.length > 0 ? Math.round((row.count / periodOrders.length) * 100) : 0;
                const barColor =
                  row.status === 'Annulée'
                    ? 'bg-[#B42318]'
                    : row.status === 'Terminée' || row.status === 'Confirmée'
                    ? 'bg-[#2A4036]'
                    : row.status === 'En expédition'
                    ? 'bg-indigo-600'
                    : row.status === 'En cours'
                    ? 'bg-[#B45309]'
                    : 'bg-[#3B82F6]';
                return (
                  <div key={row.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-[#141413]">{row.status}</span>
                      <span className="font-mono tabular-nums text-[#5C5A55]">
                        {row.count} ({pct}%) · {formatPrice(row.amount, currency)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F1F0EC] overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateSection('orders')}
            className="mt-6 pt-4 border-t border-[#F0EFEA] w-full flex items-center justify-between text-xs font-semibold text-[#2A4036] hover:underline"
          >
            <span>Gérer les commandes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Breakdown + Catalogue & Community Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Performance */}
        <div className="lg:col-span-6 bg-white border border-[#E3E3E6] rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-sm font-semibold text-[#141413]">
                Performance par catégorie
              </h3>
              <p className="text-xs text-[#6B6860] mt-0.5">
                Volume généré et quantité demandée par univers produit
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('categories')}
              className="text-xs font-semibold text-[#2A4036] hover:underline whitespace-nowrap"
            >
              Catégories →
            </button>
          </div>

          {categoryPerformance.length === 0 ? (
            <p className="text-xs text-[#6B6860] py-6 text-center">
              Aucune catégorie configurée.
            </p>
          ) : (
            <div className="space-y-4">
              {categoryPerformance.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-medium text-[#141413] truncate">{cat.name}</span>
                      <span className="ml-2 text-[#8A877E] font-mono tabular-nums">
                        {cat.prodCount} prod.
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-[#141413] font-medium shrink-0">
                      {cat.units} u. · {formatPrice(cat.revenue, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F1F0EC] overflow-hidden">
                    <div
                      style={{ width: `${cat.revenue > 0 ? Math.max(6, cat.pctOfTop) : 0}%` }}
                      className="h-full bg-[#2A4036] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community & Store Health Metrics */}
        <div className="lg:col-span-6 bg-white border border-[#E3E3E6] rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-sm font-semibold text-[#141413]">
                Santé éditoriale &amp; boutique
              </h3>
              <p className="text-xs text-[#6B6860] mt-0.5">
                Vue synthétique des contenus publiés et interactions visiteurs
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('articles')}
              className="text-xs font-semibold text-[#2A4036] hover:underline whitespace-nowrap"
            >
              Communauté →
            </button>
          </div>

          <div className="divide-y divide-[#F0EFEA] text-xs">
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-[#5C5A55]">Produits actifs en boutique</span>
              <span className="font-mono tabular-nums font-semibold text-[#141413]">
                {stats.activeProducts} / {products.length}
                {stats.lowOrOutStock > 0 ? ` (${stats.lowOrOutStock} stock faible/rupture)` : ''}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-[#5C5A55]">Articles publiés &amp; mentions J’aime</span>
              <span className="font-mono tabular-nums font-semibold text-[#141413]">
                {stats.publishedArticlesCount} articles · {stats.totalLikes} j’aime
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-[#5C5A55]">Article le plus apprécié</span>
              <span className="font-medium text-[#141413] truncate max-w-[240px]">
                {stats.topArticle
                  ? `${stats.topArticle.title} (${stats.topArticle.likesCount || 0})`
                  : '—'}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-[#5C5A55]">Vidéos YouTube visibles</span>
              <span className="font-mono tabular-nums font-semibold text-[#141413]">
                {stats.visibleVideos} / {videos.length}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-[#5C5A55]">Témoignages publiés &amp; note moyenne</span>
              <span className="font-mono tabular-nums font-semibold text-[#141413]">
                {stats.publishedTestimonialsCount} avis · {stats.avgRating} / 5
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-[#5C5A55]">Messages de contact</span>
              <span className="font-mono tabular-nums font-semibold text-[#141413]">
                {contactMessages.length} reçus ({stats.unreadMessages} non lu
                {stats.unreadMessages > 1 ? 's' : ''})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders + Popular Products & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white border border-[#E3E3E6] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E3E3E6] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#141413]">Commandes récentes</h3>
            <button
              type="button"
              onClick={() => onNavigateSection('orders')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A4036] hover:underline"
            >
              <span>Toutes les commandes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3E3E6] text-[11px] font-semibold text-[#6B6860] bg-[#FAFAFA]">
                  <th className="py-2.5 px-4">Commande</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4">Produit(s)</th>
                  <th className="py-2.5 px-4 text-right">Montant</th>
                  <th className="py-2.5 px-4">Statut</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA] text-xs">
                {orders.slice(0, 6).map((order) => {
                  const st = getOrderStatusStyle(order.status);
                  const firstProduct = order.items[0]?.productName || '—';
                  const extra = order.items.length > 1 ? ` (+${order.items.length - 1})` : '';
                  return (
                    <tr key={order.id} className="hover:bg-[#FAFAFA]">
                      <td className="py-3 px-4 font-mono font-medium tabular-nums text-[#141413]">
                        <div>{order.orderNumber}</div>
                        <div className="text-[10px] font-normal text-[#8A877E]">
                          {formatDateTimeFr(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#141413]">
                        {order.customerFirstName} {order.customerLastName}
                      </td>
                      <td className="py-3 px-4 text-[#5C5A55] max-w-[190px] truncate">
                        {firstProduct}
                        {extra}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-[#141413] whitespace-nowrap">
                        {formatPrice(order.indicativeTotal, currency)}
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
                          onClick={() => onInspectOrder(order.id)}
                          className="text-xs font-semibold text-[#2A4036] hover:underline"
                        >
                          Consulter
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-[#5C5A55]">
                      Aucune commande enregistrée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products & Activity Feed */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#E3E3E6] rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-semibold text-[#141413]">
                Produits les plus demandés
              </h3>
              <span className="text-[11px] font-mono text-[#6B6860]">{PERIOD_LABELS[period]}</span>
            </div>
            <div className="space-y-3">
              {productPerformance.map(({ product: prod, units, revenue }) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-3 text-xs pb-2.5 border-b border-[#F3F2EE] last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#141413] truncate">{prod.name}</p>
                    <p className="text-[11px] font-mono tabular-nums text-[#6B6860]">
                      {formatPrice(prod.price, currency)} · {units} unité{units > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#2A4036] shrink-0">
                    {formatPrice(revenue, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E3E3E6] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#141413] mb-4">Activité récente</h3>
            <div className="space-y-3">
              {activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="text-xs pb-2.5 border-b border-[#F3F2EE] last:border-0 last:pb-0"
                >
                  <p className="font-medium text-[#141413]">{act.action}</p>
                  <p className="text-[#5C5A55] truncate mt-0.5">{act.target}</p>
                  <p className="text-[11px] text-[#8A877E] mt-0.5 font-mono tabular-nums">
                    {act.actorName} · {formatDateTimeFr(act.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
