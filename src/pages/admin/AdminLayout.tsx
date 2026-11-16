import {
  ExternalLink,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { AdminUserPublic } from '../../types/cms';

export type AdminSection =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'categories'
  | 'customers'
  | 'articles'
  | 'videos'
  | 'testimonials'
  | 'media'
  | 'site-content'
  | 'messages'
  | 'settings';

interface AdminLayoutProps {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  adminUser: AdminUserPublic;
  siteName: string;
  newOrdersCount: number;
  unreadMessagesCount: number;
  onLogout: () => void;
  onViewPublicSite: () => void;
  children: ReactNode;
}

const SECTION_LABELS: Record<AdminSection, string> = {
  dashboard: 'Tableau de bord',
  orders: 'Commandes',
  products: 'Produits',
  categories: 'Catégories',
  customers: 'Clients',
  articles: 'Communauté · Articles',
  videos: 'Vidéos YouTube',
  testimonials: 'Témoignages',
  media: 'Bibliothèque média',
  'site-content': 'Contenu du site',
  messages: 'Messages de contact',
  settings: 'Paramètres',
};

export function AdminLayout({
  activeSection,
  onSelectSection,
  adminUser,
  siteName,
  newOrdersCount,
  unreadMessagesCount,
  onLogout,
  onViewPublicSite,
  children,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navGroups: Array<{
    title: string;
    items: Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboard; badge?: number }>;
  }> = [
    {
      title: 'Pilotage',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'orders', label: 'Commandes', icon: ShoppingBag, badge: newOrdersCount },
        { id: 'customers', label: 'Clients', icon: Users },
      ],
    },
    {
      title: 'Catalogue',
      items: [
        { id: 'products', label: 'Produits', icon: Package },
        { id: 'categories', label: 'Catégories', icon: FolderTree },
      ],
    },
    {
      title: 'Communauté & CMS',
      items: [
        { id: 'articles', label: 'Articles', icon: FileText },
        { id: 'videos', label: 'Vidéos', icon: Video },
        { id: 'testimonials', label: 'Témoignages', icon: MessageSquareQuote },
        { id: 'media', label: 'Médias', icon: Image },
        { id: 'site-content', label: 'Contenu du site', icon: LayoutTemplate },
      ],
    },
    {
      title: 'Relation & Configuration',
      items: [
        { id: 'messages', label: 'Messages', icon: Mail, badge: unreadMessagesCount },
        { id: 'settings', label: 'Paramètres', icon: Settings },
      ],
    },
  ];

  const handleNav = (id: AdminSection) => {
    setSidebarOpen(false);
    onSelectSection(id);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#161817] text-stone-200 select-none">
      <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{siteName}</p>
          <p className="text-[11px] text-stone-400 truncate">Back-Office Administrateur</p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fermer le menu"
          className="lg:hidden text-stone-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Menu administration">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[11px] font-medium text-stone-400">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#2A4036] text-white'
                        : 'text-stone-300 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 opacity-85" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono tabular-nums rounded bg-white/15 text-white shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1.5">
        <button
          type="button"
          onClick={onViewPublicSite}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-300 hover:bg-white/8 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          <span>Voir le site public</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-400 hover:bg-red-950/50 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F6F7] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-64 h-full">{SidebarContent}</aside>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E3E3E6] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu administration"
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#3F3E3A] hover:bg-[#F6F6F7]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="text-[#6B6860] hidden sm:inline">Administration</span>
              <span className="text-[#B8B4AC] hidden sm:inline">/</span>
              <h1 className="font-semibold text-[#141413] truncate">
                {SECTION_LABELS[activeSection]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onViewPublicSite}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3F3E3A] bg-[#F6F6F7] border border-[#E3E3E6] rounded-lg hover:bg-[#EFECE6]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Site public</span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[#141413]">{adminUser.name}</p>
              <p className="text-[11px] text-[#6B6860]">{adminUser.role}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
