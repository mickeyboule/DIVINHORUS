import {
  Cloud,
  CloudOff,
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
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useFirebase } from '../../contexts/FirebaseContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { authApi } from '../../lib/api';
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
  onFirebaseConnected?: () => void;
  children: ReactNode;
}

export function AdminLayout({
  activeSection,
  onSelectSection,
  adminUser,
  siteName,
  newOrdersCount,
  unreadMessagesCount,
  onLogout,
  onViewPublicSite,
  onFirebaseConnected,
  children,
}: AdminLayoutProps) {
  const { t } = useLanguage();
  const { authReady, isFirebaseAdmin } = useFirebase();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectingFirebase, setConnectingFirebase] = useState(false);
  const [firebaseBannerError, setFirebaseBannerError] = useState('');

  const handleConnectFirebase = async () => {
    setFirebaseBannerError('');
    setConnectingFirebase(true);
    try {
      await authApi.loginWithGoogle();
      onFirebaseConnected?.();
    } catch (err) {
      setFirebaseBannerError(
        err instanceof Error ? err.message : 'Impossible de connecter Firebase.',
      );
    } finally {
      setConnectingFirebase(false);
    }
  };

  const sectionLabels: Record<AdminSection, string> = {
    dashboard: t('admin.secDashboard'),
    orders: t('admin.secOrders'),
    products: t('admin.secProducts'),
    categories: t('admin.secCategories'),
    customers: t('admin.secCustomers'),
    articles: t('admin.secArticlesBreadcrumb'),
    videos: t('admin.secVideosBreadcrumb'),
    testimonials: t('admin.secTestimonials'),
    media: t('admin.secMediaBreadcrumb'),
    'site-content': t('admin.secSiteContent'),
    messages: t('admin.secMessagesBreadcrumb'),
    settings: t('admin.secSettings'),
  };

  const navGroups: Array<{
    title: string;
    items: Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboard; badge?: number }>;
  }> = [
    {
      title: t('admin.groupPilotage'),
      items: [
        { id: 'dashboard', label: t('admin.secDashboard'), icon: LayoutDashboard },
        { id: 'orders', label: t('admin.secOrders'), icon: ShoppingBag, badge: newOrdersCount },
        { id: 'customers', label: t('admin.secCustomers'), icon: Users },
      ],
    },
    {
      title: t('admin.groupCatalogue'),
      items: [
        { id: 'products', label: t('admin.secProducts'), icon: Package },
        { id: 'categories', label: t('admin.secCategories'), icon: FolderTree },
      ],
    },
    {
      title: t('admin.groupCms'),
      items: [
        { id: 'articles', label: t('admin.secArticles'), icon: FileText },
        { id: 'videos', label: t('admin.secVideos'), icon: Video },
        { id: 'testimonials', label: t('admin.secTestimonials'), icon: MessageSquareQuote },
        { id: 'media', label: t('admin.secMedia'), icon: Image },
        { id: 'site-content', label: t('admin.secSiteContent'), icon: LayoutTemplate },
      ],
    },
    {
      title: t('admin.groupConfig'),
      items: [
        { id: 'messages', label: t('admin.secMessages'), icon: Mail, badge: unreadMessagesCount },
        { id: 'settings', label: t('admin.secSettings'), icon: Settings },
      ],
    },
  ];

  const handleNav = (id: AdminSection) => {
    setSidebarOpen(false);
    onSelectSection(id);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#181511] text-stone-200 select-none">
      <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{siteName}</p>
          <p className="text-[11px] text-stone-400 truncate">{t('admin.backOfficeSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label={t('admin.closeMenu')}
          className="lg:hidden text-stone-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label={t('admin.navAria')}>
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
                        ? 'bg-[#8F6B18] text-white'
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
        <div className="px-3 py-1.5 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">{t('nav.languageLabel')}</span>
          <LanguageSwitcher variant="dark" />
        </div>
        <button
          type="button"
          onClick={onViewPublicSite}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-300 hover:bg-white/8 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          <span>{t('admin.viewPublicSite')}</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-400 hover:bg-red-950/50 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{t('admin.logout')}</span>
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
              aria-label={t('admin.openMenu')}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#3F3E3A] hover:bg-[#F6F6F7]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="text-[#6B6860] hidden sm:inline">{t('admin.breadcrumb')}</span>
              <span className="text-[#B8B4AC] hidden sm:inline">/</span>
              <h1 className="font-semibold text-[#141413] truncate">
                {sectionLabels[activeSection]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              onClick={onViewPublicSite}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3F3E3A] bg-[#F6F6F7] border border-[#E3E3E6] rounded-lg hover:bg-[#EFECE6]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('admin.publicSiteShort')}</span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[#141413]">{adminUser.name}</p>
              <p className="text-[11px] text-[#6B6860]">{adminUser.role}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto">
          {authReady && !isFirebaseAdmin && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <CloudOff className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-0.5">
                  <p className="font-semibold">
                    Synchronisation Firebase (site-divinhorus) en attente
                  </p>
                  <p className="text-amber-800">
                    Connectez votre compte Google administrateur (bisnessweb24@gmail.com) pour
                    enregistrer durablement toutes vos fiches et images dans Firebase Firestore.
                  </p>
                  {firebaseBannerError && (
                    <p className="text-red-700 font-medium pt-1">{firebaseBannerError}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectFirebase}
                disabled={connectingFirebase}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition-colors"
              >
                <Cloud className="w-4 h-4" />
                <span>
                  {connectingFirebase ? 'Connexion...' : 'Connecter Firebase (Google)'}
                </span>
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
