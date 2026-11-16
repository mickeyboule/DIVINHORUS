import { ArrowRight, Plus } from 'lucide-react';
import { formatDateTimeFr, formatPrice, getOrderStatusStyle } from '../../lib/format';
import type { AdminBootstrapData, AdminUserPublic } from '../../types/cms';
import type { AdminSection } from './AdminLayout';

interface AdminDashboardViewProps {
  data: AdminBootstrapData;
  adminUser: AdminUserPublic;
  onNavigateSection: (sec: AdminSection) => void;
  onInspectOrder: (orderId: string) => void;
}

export function AdminDashboardView({
  data,
  adminUser,
  onNavigateSection,
  onInspectOrder,
}: AdminDashboardViewProps) {
  const { orders, products, customers, articles, videos, activities, settings } = data;
  const currency = settings.general.currencySymbol;

  const todayStr = new Date().toISOString().slice(0, 10);
  const ordersToday = orders.filter((o) => o.createdAt.slice(0, 10) === todayStr).length;
  const newOrders = orders.filter((o) => o.status === 'Nouvelle').length;
  const activeProducts = products.filter((p) => p.active).length;
  const publishedArticles = articles.filter((a) => a.status === 'Publié').length;
  const visibleVideos = videos.filter((v) => v.visible).length;

  // Build 14-day orders volume series
  const days = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    const key = d.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d);
    const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === key);
    return {
      key,
      label,
      count: dayOrders.length,
      total: dayOrders.reduce((s, o) => s + o.indicativeTotal, 0),
    };
  });

  const maxCount = Math.max(2, ...days.map((d) => d.count));

  const statusBreakdown = (['Nouvelle', 'En cours', 'Confirmée', 'Terminée', 'Annulée'] as const).map(
    (status) => ({
      status,
      count: orders.filter((o) => o.status === status).length,
      style: getOrderStatusStyle(status),
    }),
  );

  const popularProducts = [...products]
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);

  const kpis = [
    { label: 'Commandes aujourd’hui', value: ordersToday, action: () => onNavigateSection('orders') },
    { label: 'Nouvelles commandes', value: newOrders, action: () => onNavigateSection('orders') },
    { label: 'Produits actifs', value: activeProducts, action: () => onNavigateSection('products') },
    { label: 'Clients enregistrés', value: customers.length, action: () => onNavigateSection('customers') },
    { label: 'Articles publiés', value: publishedArticles, action: () => onNavigateSection('articles') },
    { label: 'Vidéos publiées', value: visibleVideos, action: () => onNavigateSection('videos') },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#141413]">
            Bonjour, {adminUser.name}
          </h2>
          <p className="text-sm text-[#5C5A55] mt-0.5">
            Vue d’ensemble de votre boutique, des demandes de commande et de la communauté.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateSection('products')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#2A4036] text-white rounded-lg hover:bg-[#20322A]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un produit</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('articles')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-[#D9D6CF] text-[#141413] rounded-lg hover:bg-[#F7F7F8]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvel article</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={kpi.action}
            className="bg-white border border-[#E3E3E6] rounded-xl p-4 text-left hover:border-[#2A4036] transition-colors"
          >
            <p className="text-xs text-[#5C5A55] truncate">{kpi.label}</p>
            <p className="mt-2 text-2xl font-mono font-semibold tabular-nums text-[#141413]">
              {kpi.value}
            </p>
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 14-day Orders Bar Chart */}
        <div className="lg:col-span-8 bg-white border border-[#E3E3E6] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-[#141413]">
                Demandes de commande sur 14 jours
              </h3>
              <p className="text-xs text-[#6B6860] mt-0.5">
                Nombre de demandes reçues par jour
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-[#5C5A55]">
              Total : {orders.length} commandes
            </span>
          </div>

          <div className="h-44 flex items-end gap-2">
            {days.map((d) => {
              const heightPct = Math.max(6, Math.round((d.count / maxCount) * 100));
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono tabular-nums text-[#5C5A55]">
                    {d.count > 0 ? d.count : ''}
                  </span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      title={`${d.label} : ${d.count} commande(s) (${formatPrice(d.total, currency)})`}
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-colors ${
                        d.count > 0 ? 'bg-[#2A4036]' : 'bg-[#EFECE6]'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-[#6B6860] truncate w-full text-center">
                    {d.label.slice(0, 5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="lg:col-span-4 bg-white border border-[#E3E3E6] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#141413]">Répartition par statut</h3>
          <p className="text-xs text-[#6B6860] mt-0.5 mb-5">
            Suivi global des demandes clients
          </p>
          <div className="space-y-3.5">
            {statusBreakdown.map((row) => {
              const pct = orders.length > 0 ? Math.round((row.count / orders.length) * 100) : 0;
              return (
                <div key={row.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#141413]">{row.status}</span>
                    <span className="font-mono tabular-nums text-[#5C5A55]">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F1F0EC] overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-[#2A4036] rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders + Popular Products & Activity */}
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
                  <th className="py-2.5 px-4">Date</th>
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
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#141413]">
                        {order.customerFirstName} {order.customerLastName}
                      </td>
                      <td className="py-3 px-4 text-[#5C5A55] max-w-[200px] truncate">
                        {firstProduct}
                        {extra}
                      </td>
                      <td className="py-3 px-4 text-[#6B6860] whitespace-nowrap font-mono tabular-nums">
                        {formatDateTimeFr(order.createdAt)}
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

        {/* Popular Products & Activity Feed */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#E3E3E6] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#141413] mb-4">Produits populaires</h3>
            <div className="space-y-3">
              {popularProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-3 text-xs pb-2.5 border-b border-[#F3F2EE] last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#141413] truncate">{prod.name}</p>
                    <p className="text-[11px] font-mono tabular-nums text-[#6B6860]">
                      {formatPrice(prod.price, currency)}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#2A4036] shrink-0">
                    {prod.orderCount} dem.
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E3E3E6] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#141413] mb-4">Activité récente</h3>
            <div className="space-y-3">
              {activities.slice(0, 6).map((act) => (
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
