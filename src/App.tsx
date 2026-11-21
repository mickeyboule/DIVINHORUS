import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { OrderDrawer, type BasketItem } from './components/OrderDrawer';
import { TestimonialModal } from './components/TestimonialModal';
import { ToastStack, type ToastItem } from './components/Toast';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { WelcomeAnnouncementModal } from './components/WelcomeAnnouncementModal';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { useLanguage } from './contexts/LanguageContext';
import { adminApi, authApi, getOrCreateClientKey, publicApi, visitorApi } from './lib/api';
import { auth } from './lib/firebase';
import { localizeProduct, localizePublicBootstrapData } from './lib/i18n';
import { AdminArticlesView } from './pages/admin/AdminArticlesView';
import { AdminCategoriesView } from './pages/admin/AdminCategoriesView';
import { AdminCustomersView } from './pages/admin/AdminCustomersView';
import { AdminDashboardView } from './pages/admin/AdminDashboardView';
import { AdminLayout, type AdminSection } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminMediaView } from './pages/admin/AdminMediaView';
import { AdminMessagesView } from './pages/admin/AdminMessagesView';
import { AdminOrdersView } from './pages/admin/AdminOrdersView';
import { AdminProductsView } from './pages/admin/AdminProductsView';
import { AdminSettingsView } from './pages/admin/AdminSettingsView';
import { AdminSiteContentView } from './pages/admin/AdminSiteContentView';
import { AdminTestimonialsView } from './pages/admin/AdminTestimonialsView';
import { AdminVideosView } from './pages/admin/AdminVideosView';
import { AboutPage } from './pages/public/AboutPage';
import { ArticleDetailPage } from './pages/public/ArticleDetailPage';
import { CommunityPage } from './pages/public/CommunityPage';
import { ContactPage } from './pages/public/ContactPage';
import { HomePage } from './pages/public/HomePage';
import { OrderTrackingPage } from './pages/public/OrderTrackingPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { ShopPage } from './pages/public/ShopPage';
import { VisitorAccountPage } from './pages/public/VisitorAccountPage';
import type {
  AdminBootstrapData,
  AdminUserPublic,
  MediaItem,
  Order,
  Product,
  PublicBootstrapData,
  VideoItem,
  VisitorMemberPublic,
} from './types/cms';

export default function App() {
  const { lang, t } = useLanguage();
  const [route, setRoute] = useState<string>(() => window.location.pathname + window.location.search);

  const [publicData, setPublicData] = useState<PublicBootstrapData | null>(null);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError, setPublicError] = useState('');

  const [basket, setBasket] = useState<BasketItem[]>(() => {
    try {
      const raw = localStorage.getItem('dh_basket_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage access errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('dh_basket_v1', JSON.stringify(basket));
    } catch {
      // Ignore storage errors
    }
  }, [basket]);
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const [visitorUser, setVisitorUser] = useState<VisitorMemberPublic | null>(null);
  const [visitorOrders, setVisitorOrders] = useState<Order[]>([]);

  const [adminUser, setAdminUser] = useState<AdminUserPublic | null>(null);
  const [adminChecking, setAdminChecking] = useState(false);
  const [adminData, setAdminData] = useState<AdminBootstrapData | null>(null);
  const [adminSection, setAdminSection] = useState<AdminSection>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const localizedPublicData = useMemo(
    () => (publicData ? localizePublicBootstrapData(publicData, lang) : null),
    [publicData, lang],
  );

  const localizedBasket = useMemo(
    () =>
      basket.map((item) => ({
        ...item,
        product:
          localizedPublicData?.products.find((p) => p.id === item.product.id) ??
          localizeProduct(item.product, lang),
      })),
    [basket, localizedPublicData?.products, lang],
  );

  useEffect(() => {
    const siteName = localizedPublicData?.settings.general.siteName;
    const tagline = localizedPublicData?.settings.general.tagline;
    if (siteName) {
      document.title = tagline ? `${siteName} — ${tagline}` : siteName;
    }
  }, [localizedPublicData?.settings.general.siteName, localizedPublicData?.settings.general.tagline]);

  const fetchPublic = useCallback(async () => {
    try {
      const data = await publicApi.getBootstrap();
      setPublicData(data);
      setPublicError('');
      if (data.settings.general.faviconUrl) {
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = data.settings.general.faviconUrl;
      }
    } catch (err) {
      setPublicError(err instanceof Error ? err.message : t('app.loadError'));
    } finally {
      setPublicLoading(false);
    }
  }, [t]);

  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const adminDataLoadedRef = useRef(false);

  const fetchAdmin = useCallback(
    async (notifyNewOrders = false) => {
      try {
        await auth.authStateReady();
        const data = await adminApi.getBootstrap();
        if (notifyNewOrders && knownOrderIdsRef.current) {
          const added = data.orders.filter((o) => !knownOrderIdsRef.current!.has(o.id));
          if (added.length === 1) {
            notify('success', t('app.newOrderReceived', { orderNumber: added[0].orderNumber }));
          } else if (added.length > 1) {
            notify('success', t('app.newOrdersReceived', { count: added.length }));
          }
        }
        knownOrderIdsRef.current = new Set(data.orders.map((o) => o.id));
        adminDataLoadedRef.current = true;
        setAdminData(data);

        const ytSync = data.settings.youtubeSync;
        if (ytSync?.autoSync && (ytSync.channelId || ytSync.channelUrl)) {
          const lastMs = ytSync.lastSyncAt ? Date.parse(ytSync.lastSyncAt) : 0;
          if (!lastMs || Date.now() - lastMs > 1000 * 60 * 10) {
            void adminApi
              .syncYoutubeChannel(ytSync.channelUrl || ytSync.channelId, true)
              .then((syncRes) => {
                setAdminData((prev) =>
                  prev
                    ? {
                        ...prev,
                        videos: syncRes.videos,
                        settings: { ...prev.settings, youtubeSync: syncRes.youtubeSync },
                      }
                    : prev,
                );
                if (syncRes.addedCount > 0) {
                  void fetchPublic();
                }
              })
              .catch(() => {
                // Silent background sync
              });
          }
        }

        return data;
      } catch {
        return null;
      }
    },
    [notify, t, fetchPublic],
  );

  useEffect(() => {
    void fetchPublic();
    visitorApi
      .me()
      .then((res) => {
        setVisitorUser(res.visitor);
        setVisitorOrders(res.orders);
      })
      .catch(async () => {
        try {
          await auth.authStateReady();
          if (auth.currentUser) {
            const synced = await authApi.syncFromFirebaseUser('visitor');
            if (synced && synced.role === 'visitor') {
              setVisitorUser(synced.visitor);
              setVisitorOrders(synced.orders);
            }
          }
        } catch {
          // Visitor not logged in
        }
      });
  }, [fetchPublic]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      if (path !== route) {
        window.history.pushState({}, '', path);
        setRoute(path);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (!path.startsWith('/admin')) {
        void fetchPublic();
      }
    },
    [route, fetchPublic],
  );

  // Check admin session when entering /admin
  const isAdminRoute =
    route.split('?')[0].startsWith('/admin') || window.location.hash.startsWith('#/admin');

  const welcomeAnnouncement = localizedPublicData?.siteContent?.welcomeAnnouncement;

  useEffect(() => {
    if (isAdminRoute || publicLoading || !publicData) return;
    if (
      !welcomeAnnouncement ||
      !welcomeAnnouncement.enabled ||
      (!welcomeAnnouncement.title.trim() && !welcomeAnnouncement.message.trim())
    ) {
      setAnnouncementOpen(false);
      return;
    }
    const key = `dh_announcement_seen_${welcomeAnnouncement.version || 'v1'}`;
    try {
      const storage =
        welcomeAnnouncement.displayFrequency === 'once_per_update'
          ? localStorage
          : sessionStorage;
      if (storage.getItem(key) === '1') return;
    } catch {
      // Ignore storage errors
    }
    setAnnouncementOpen(true);
  }, [
    isAdminRoute,
    publicLoading,
    publicData,
    welcomeAnnouncement?.enabled,
    welcomeAnnouncement?.version,
    welcomeAnnouncement?.displayFrequency,
    welcomeAnnouncement?.title,
    welcomeAnnouncement?.message,
  ]);

  const handleDismissAnnouncement = useCallback(() => {
    setAnnouncementOpen(false);
    if (!welcomeAnnouncement) return;
    const key = `dh_announcement_seen_${welcomeAnnouncement.version || 'v1'}`;
    try {
      const storage =
        welcomeAnnouncement.displayFrequency === 'once_per_update'
          ? localStorage
          : sessionStorage;
      storage.setItem(key, '1');
    } catch {
      // Ignore storage errors
    }
  }, [welcomeAnnouncement]);

  useEffect(() => {
    if (!isAdminRoute) return;
    if (adminUser && adminDataLoadedRef.current) {
      void fetchAdmin(true);
      return;
    }
    let active = true;
    setAdminChecking(true);
    auth
      .authStateReady()
      .then(() => authApi.me())
      .then(async (res) => {
        if (!active) return;
        const data = await adminApi.getBootstrap();
        if (!active) return;
        knownOrderIdsRef.current = new Set(data.orders.map((o) => o.id));
        adminDataLoadedRef.current = true;
        setAdminData(data);
        setAdminUser(res.admin);
      })
      .catch(async () => {
        try {
          await auth.authStateReady();
          if (auth.currentUser && active) {
            const synced = await authApi.syncFromFirebaseUser('admin');
            if (synced && synced.role === 'admin' && active) {
              const data = await adminApi.getBootstrap();
              if (!active) return;
              knownOrderIdsRef.current = new Set(data.orders.map((o) => o.id));
              adminDataLoadedRef.current = true;
              setAdminData(data);
              setAdminUser(synced.admin);
              return;
            }
          }
        } catch {
          // Ignore and show admin login page
        }
        if (!active) return;
        adminDataLoadedRef.current = false;
        setAdminUser(null);
        setAdminData(null);
      })
      .finally(() => {
        if (active) setAdminChecking(false);
      });
    return () => {
      active = false;
    };
  }, [isAdminRoute, adminUser?.id, fetchAdmin]);

  // Keep admin dashboard, orders, and registered user data synchronized in real time
  useEffect(() => {
    if (!isAdminRoute || !adminUser) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchAdmin(true);
      }
    }, 8000);
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchAdmin(true);
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [isAdminRoute, adminUser, fetchAdmin]);

  // Refresh visitor account data when visiting /mon-compte
  useEffect(() => {
    const cleanPath = route.split('?')[0];
    if (cleanPath !== '/mon-compte' || !visitorUser) return;
    visitorApi
      .me()
      .then((res) => {
        setVisitorUser(res.visitor);
        setVisitorOrders(res.orders);
      })
      .catch(() => {});
  }, [route, visitorUser?.id]);

  // Deep-link /admin?order=CMD-XXXX straight to that order's details once admin is logged in
  useEffect(() => {
    if (!isAdminRoute || !adminUser || !adminData) return;
    const [, query = ''] = route.split('?');
    const params = new URLSearchParams(query);
    const orderParam = (params.get('order') || params.get('orderId') || '').trim();
    if (!orderParam) return;

    let cancelled = false;
    const resolveOrderLink = async () => {
      const normalized = orderParam.toUpperCase();
      let ordersToSearch = adminData.orders;
      let match = ordersToSearch.find(
        (o) => o.id === orderParam || o.orderNumber.toUpperCase() === normalized,
      );
      if (!match) {
        const fresh = await fetchAdmin(false);
        if (cancelled) return;
        if (fresh) {
          ordersToSearch = fresh.orders;
          match = ordersToSearch.find(
            (o) => o.id === orderParam || o.orderNumber.toUpperCase() === normalized,
          );
        }
      }
      if (cancelled) return;
      if (match) {
        setAdminSection('orders');
        setSelectedOrderId(match.id);
      } else {
        notify('error', t('app.orderNotFound', { orderParam }));
      }
      window.history.replaceState({}, '', '/admin');
      setRoute('/admin');
    };
    void resolveOrderLink();
    return () => {
      cancelled = true;
    };
  }, [isAdminRoute, adminUser, adminData, route, notify, fetchAdmin, t]);

  // Basket handlers
  const handleAddToBasket = (product: Product, qty = 1, openDrawer = false) => {
    setBasket((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i,
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    if (openDrawer) {
      setOrderDrawerOpen(true);
    } else {
      notify('success', t('app.addedToSelection', { name: product.name }));
    }
  };

  const handleOrderProduct = (product: Product, qty = 1) => {
    handleAddToBasket(product, qty, true);
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setBasket((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setBasket((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: Math.min(99, qty) } : i)),
    );
  };

  const handleRemoveItem = (productId: string) => {
    setBasket((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleAdminLoginSuccess = async (admin: AdminUserPublic) => {
    const data = await adminApi.getBootstrap();
    knownOrderIdsRef.current = new Set(data.orders.map((o) => o.id));
    adminDataLoadedRef.current = true;
    setAdminData(data);
    setAdminUser(admin);
    notify('success', t('app.adminWelcome', { name: admin.name }));
  };

  const handleAdminLogout = async () => {
    await authApi.logout();
    adminDataLoadedRef.current = false;
    knownOrderIdsRef.current = null;
    setAdminUser(null);
    setAdminData(null);
    navigate('/');
    notify('success', t('app.adminLogout'));
  };

  const handleMediaAdded = (item: MediaItem) => {
    setAdminData((prev) => (prev ? { ...prev, media: [item, ...prev.media] } : prev));
  };

  const actorKey = visitorUser ? `visitor:${visitorUser.id}` : `anon:${getOrCreateClientKey()}`;

  const handleToggleArticleLike = async (articleId: string) => {
    try {
      const res = await publicApi.toggleArticleLike(articleId);
      setPublicData((prev) =>
        prev
          ? {
              ...prev,
              articles: prev.articles.map((a) => (a.id === res.article.id ? res.article : a)),
            }
          : prev,
      );
      notify('success', res.liked ? t('app.articleLiked') : t('app.articleUnliked'));
    } catch (err) {
      notify('error', err instanceof Error ? err.message : t('app.actionImpossible'));
    }
  };

  const handleVisitorLogout = async () => {
    await visitorApi.logout();
    setVisitorUser(null);
    setVisitorOrders([]);
    notify('success', t('app.visitorLogout'));
  };

  // ---------------- ADMIN PORTAL RENDER ----------------
  if (isAdminRoute) {
    const siteName = adminData?.settings.general.siteName || publicData?.settings.general.siteName || 'DIVIN HORUS';

    if (adminChecking) {
      return (
        <div className="min-h-screen bg-[#F6F6F7] flex items-center justify-center text-sm text-[#5C5A55]">
          {t('app.verifyingSession')}
        </div>
      );
    }

    if (!adminUser) {
      return (
        <>
          <AdminLoginPage
            siteName={siteName}
            onSuccess={handleAdminLoginSuccess}
            onBackPublic={() => navigate('/')}
          />
          <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
        </>
      );
    }

    if (!adminData) {
      return (
        <div className="min-h-screen bg-[#F6F6F7] flex items-center justify-center text-sm text-[#5C5A55]">
          {t('app.loadingAdmin')}
        </div>
      );
    }

    const newOrdersCount = adminData.orders.filter((o) => o.status === 'Nouvelle').length;
    const unreadMessagesCount = adminData.contactMessages.filter((m) => !m.read).length;

    return (
      <>
        <AdminLayout
          activeSection={adminSection}
          onSelectSection={(sec) => {
            setAdminSection(sec);
            if (sec !== 'orders') setSelectedOrderId(null);
            if (sec === 'dashboard' || sec === 'orders' || sec === 'customers' || sec === 'messages') {
              void fetchAdmin(true);
            }
          }}
          adminUser={adminUser}
          siteName={adminData.settings.general.siteName}
          newOrdersCount={newOrdersCount}
          unreadMessagesCount={unreadMessagesCount}
          onLogout={handleAdminLogout}
          onViewPublicSite={() => navigate('/')}
          onFirebaseConnected={() => {
            void fetchAdmin(false);
            void fetchPublic();
            notify('success', 'Synchronisation Firebase activée sur site-divinhorus.');
          }}
        >
          {adminSection === 'dashboard' && (
            <AdminDashboardView
              data={adminData}
              adminUser={adminUser}
              onNavigateSection={setAdminSection}
              onInspectOrder={(id) => {
                setSelectedOrderId(id);
                setAdminSection('orders');
              }}
            />
          )}

          {adminSection === 'orders' && (
            <AdminOrdersView
              orders={adminData.orders}
              currencySymbol={adminData.settings.general.currencySymbol}
              settings={adminData.settings}
              media={adminData.media}
              selectedOrderId={selectedOrderId}
              onSelectOrder={setSelectedOrderId}
              onOrderUpdated={(updated) => {
                setAdminData((prev) =>
                  prev
                    ? { ...prev, orders: prev.orders.map((o) => (o.id === updated.id ? updated : o)) }
                    : prev,
                );
              }}
              onMediaAdded={handleMediaAdded}
              onSettingsChanged={(settings) => {
                setAdminData((prev) => (prev ? { ...prev, settings } : prev));
                setPublicData((prev) => (prev ? { ...prev, settings } : prev));
              }}
              onNotify={notify}
            />
          )}

          {adminSection === 'products' && (
            <AdminProductsView
              products={adminData.products}
              categories={adminData.categories}
              media={adminData.media}
              currencySymbol={adminData.settings.general.currencySymbol}
              onProductsChanged={(products) => {
                setAdminData((prev) => (prev ? { ...prev, products } : prev));
                void fetchPublic();
              }}
              onMediaAdded={handleMediaAdded}
              onNotify={notify}
            />
          )}

          {adminSection === 'categories' && (
            <AdminCategoriesView
              categories={adminData.categories}
              products={adminData.products}
              media={adminData.media}
              onCategoriesChanged={(categories) => {
                setAdminData((prev) => (prev ? { ...prev, categories } : prev));
                void fetchPublic();
              }}
              onMediaAdded={handleMediaAdded}
              onNotify={notify}
            />
          )}

          {adminSection === 'customers' && (
            <AdminCustomersView
              customers={adminData.customers}
              visitors={adminData.visitors}
              orders={adminData.orders}
              currencySymbol={adminData.settings.general.currencySymbol}
              onCustomerCreated={(cust) =>
                setAdminData((prev) =>
                  prev ? { ...prev, customers: [cust, ...prev.customers] } : prev,
                )
              }
              onCustomerUpdated={(cust) =>
                setAdminData((prev) =>
                  prev
                    ? { ...prev, customers: prev.customers.map((c) => (c.id === cust.id ? cust : c)) }
                    : prev,
                )
              }
              onCustomerDeleted={(customerId) =>
                setAdminData((prev) =>
                  prev
                    ? { ...prev, customers: prev.customers.filter((c) => c.id !== customerId) }
                    : prev,
                )
              }
              onInspectOrder={(id) => {
                setSelectedOrderId(id);
                setAdminSection('orders');
              }}
              onNotify={notify}
            />
          )}

          {adminSection === 'articles' && (
            <AdminArticlesView
              articles={adminData.articles}
              articleCategories={adminData.articleCategories}
              media={adminData.media}
              defaultAuthor={adminData.siteContent.master.name}
              onArticlesChanged={(articles) => {
                setAdminData((prev) => (prev ? { ...prev, articles } : prev));
                void fetchPublic();
              }}
              onArticleCategoriesChanged={(articleCategories) => {
                setAdminData((prev) => (prev ? { ...prev, articleCategories } : prev));
                void fetchPublic();
              }}
              onMediaAdded={handleMediaAdded}
              onNotify={notify}
            />
          )}

          {adminSection === 'videos' && (
            <AdminVideosView
              videos={adminData.videos}
              youtubeSync={adminData.settings.youtubeSync}
              onVideosChanged={(videos) => {
                setAdminData((prev) => (prev ? { ...prev, videos } : prev));
                void fetchPublic();
              }}
              onYoutubeSyncChanged={(youtubeSync) =>
                setAdminData((prev) =>
                  prev ? { ...prev, settings: { ...prev.settings, youtubeSync } } : prev,
                )
              }
              onNotify={notify}
            />
          )}

          {adminSection === 'testimonials' && (
            <AdminTestimonialsView
              testimonials={adminData.testimonials}
              onTestimonialsChanged={(testimonials) => {
                setAdminData((prev) => (prev ? { ...prev, testimonials } : prev));
                void fetchPublic();
              }}
              onNotify={notify}
            />
          )}

          {adminSection === 'media' && (
            <AdminMediaView
              media={adminData.media}
              onMediaChanged={(media) =>
                setAdminData((prev) => (prev ? { ...prev, media } : prev))
              }
              onNotify={notify}
            />
          )}

          {adminSection === 'site-content' && (
            <AdminSiteContentView
              siteContent={adminData.siteContent}
              products={adminData.products}
              articles={adminData.articles}
              videos={adminData.videos}
              media={adminData.media}
              onSiteContentChanged={(siteContent) => {
                setAdminData((prev) => (prev ? { ...prev, siteContent } : prev));
                setPublicData((prev) => (prev ? { ...prev, siteContent } : prev));
                void fetchPublic();
              }}
              onMediaAdded={handleMediaAdded}
              onNotify={notify}
            />
          )}

          {adminSection === 'messages' && (
            <AdminMessagesView
              messages={adminData.contactMessages}
              onMessagesChanged={(contactMessages) =>
                setAdminData((prev) => (prev ? { ...prev, contactMessages } : prev))
              }
              onNotify={notify}
            />
          )}

          {adminSection === 'settings' && (
            <AdminSettingsView
              settings={adminData.settings}
              admins={adminData.admins}
              currentAdmin={adminUser}
              media={adminData.media}
              onSettingsChanged={(settings, updatedProducts) => {
                setAdminData((prev) =>
                  prev
                    ? {
                        ...prev,
                        settings,
                        ...(updatedProducts ? { products: updatedProducts } : {}),
                      }
                    : prev,
                );
                setPublicData((prev) =>
                  prev
                    ? {
                        ...prev,
                        settings,
                        ...(updatedProducts ? { products: updatedProducts } : {}),
                      }
                    : prev,
                );
                if (settings.general.faviconUrl) {
                  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
                  if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                  }
                  link.href = settings.general.faviconUrl;
                }
                void fetchPublic();
              }}
              onAdminsChanged={(admins) =>
                setAdminData((prev) => (prev ? { ...prev, admins } : prev))
              }
              onCurrentAdminUpdated={(updated) => setAdminUser(updated)}
              onMediaAdded={handleMediaAdded}
              onNotify={notify}
            />
          )}
        </AdminLayout>

        <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      </>
    );
  }

  // ---------------- PUBLIC SITE RENDER ----------------
  if (publicLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#5C5A55]">
        {t('app.loadingSite')}
      </div>
    );
  }

  if (publicError || !localizedPublicData) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <p className="font-display text-2xl font-semibold text-[#141413]">
          {t('app.connUnavailable')}
        </p>
        <p className="mt-2 text-sm text-[#5C5A55]">{publicError}</p>
        <button
          type="button"
          onClick={() => void fetchPublic()}
          className="mt-5 px-5 py-2.5 bg-[#2A4036] text-white text-xs font-semibold rounded-lg"
        >
          {t('app.retry')}
        </button>
      </div>
    );
  }

  const [pathname, queryStr] = route.split('?');
  const searchParams = new URLSearchParams(queryStr || '');
  const basketCount = basket.reduce((s, i) => s + i.quantity, 0);

  let pageView = (
    <HomePage
      data={localizedPublicData}
      actorKey={actorKey}
      onNavigate={navigate}
      onOrderProduct={(p) => handleOrderProduct(p, 1)}
      onPlayVideo={setActiveVideo}
      onToggleArticleLike={(id) => void handleToggleArticleLike(id)}
      onOpenTestimonialModal={() => setTestimonialModalOpen(true)}
    />
  );

  if (pathname === '/boutique') {
    pageView = (
      <ShopPage
        data={localizedPublicData}
        initialCategorySlug={searchParams.get('categorie') || undefined}
        onNavigate={navigate}
        onOrderProduct={(p) => handleOrderProduct(p, 1)}
      />
    );
  } else if (pathname.startsWith('/boutique/')) {
    const slug = pathname.replace('/boutique/', '');
    pageView = (
      <ProductDetailPage
        slug={slug}
        data={localizedPublicData}
        onNavigate={navigate}
        onOrderProduct={handleOrderProduct}
        onAddToBasket={(p, q) => handleAddToBasket(p, q, false)}
      />
    );
  } else if (pathname === '/communaute') {
    const tabParam = searchParams.get('tab');
    const initialTab =
      tabParam === 'videos' || tabParam === 'articles' || tabParam === 'testimonials'
        ? tabParam
        : 'all';
    pageView = (
      <CommunityPage
        data={localizedPublicData}
        actorKey={actorKey}
        initialTab={initialTab}
        onNavigate={navigate}
        onPlayVideo={setActiveVideo}
        onToggleArticleLike={(id) => void handleToggleArticleLike(id)}
        onOpenTestimonialModal={() => setTestimonialModalOpen(true)}
      />
    );
  } else if (pathname.startsWith('/communaute/')) {
    const slug = pathname.replace('/communaute/', '');
    pageView = (
      <ArticleDetailPage
        slug={slug}
        data={localizedPublicData}
        actorKey={actorKey}
        onNavigate={navigate}
        onToggleArticleLike={(id) => void handleToggleArticleLike(id)}
      />
    );
  } else if (pathname === '/a-propos') {
    pageView = <AboutPage data={localizedPublicData} onNavigate={navigate} />;
  } else if (pathname === '/contact') {
    pageView = <ContactPage data={localizedPublicData} />;
  } else if (pathname === '/mon-compte') {
    pageView = (
      <VisitorAccountPage
        visitorUser={visitorUser}
        visitorOrders={visitorOrders}
        articles={localizedPublicData.articles}
        settings={localizedPublicData.settings}
        onAuthSuccess={(visitor, orders) => {
          setVisitorUser(visitor);
          setVisitorOrders(orders);
        }}
        onAdminAuthSuccess={async (admin) => {
          await handleAdminLoginSuccess(admin);
          window.history.pushState({}, '', '/admin');
          setRoute('/admin');
        }}
        onProfileUpdated={(visitor, orders) => {
          setVisitorUser(visitor);
          setVisitorOrders(orders);
        }}
        onLogout={handleVisitorLogout}
        onNavigate={navigate}
        onNotify={notify}
      />
    );
  } else if (pathname === '/suivi-commande') {
    pageView = (
      <OrderTrackingPage
        settings={localizedPublicData.settings}
        visitorUser={visitorUser}
        initialOrderNumber={searchParams.get('num') || ''}
        initialContact={searchParams.get('contact') || ''}
        onNavigate={navigate}
      />
    );
  }

  return (
    <CurrencyProvider settings={localizedPublicData.settings} geo={localizedPublicData.geo}>
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#141413]">
        <Header
          currentPath={pathname}
          onNavigate={navigate}
          basketCount={basketCount}
          onOpenOrderDrawer={() => setOrderDrawerOpen(true)}
          settings={localizedPublicData.settings}
          visitorUser={visitorUser}
        />

        <main className="flex-1">{pageView}</main>

        <Footer onNavigate={navigate} settings={localizedPublicData.settings} />

        <OrderDrawer
          open={orderDrawerOpen}
          onClose={() => setOrderDrawerOpen(false)}
          items={localizedBasket}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onClearBasket={() => setBasket([])}
          allProducts={localizedPublicData.products}
          onAddProduct={(p) => handleAddToBasket(p, 1, false)}
          settings={localizedPublicData.settings}
          visitorUser={visitorUser}
          onVisitorAuthenticated={(visitor, orders) => {
            setVisitorUser(visitor);
            setVisitorOrders(orders);
            notify('success', t('account.welcomeBack', { name: visitor.firstName }));
          }}
          onNavigate={navigate}
          onOrderSuccess={(ord, updatedVisitor) => {
            notify('success', t('app.orderCreated', { orderNumber: ord.orderNumber }));
            if (updatedVisitor) {
              setVisitorUser(updatedVisitor);
            }
            if (visitorUser || updatedVisitor) {
              setVisitorOrders((prev) =>
                prev.some((o) => o.id === ord.id) ? prev : [ord, ...prev],
              );
            }
            if (adminUser) void fetchAdmin(false);
          }}
        />

        <TestimonialModal
          open={testimonialModalOpen}
          onClose={() => setTestimonialModalOpen(false)}
          visitorUser={visitorUser}
          onCreated={(testimonial) => {
            setPublicData((prev) =>
              prev ? { ...prev, testimonials: [testimonial, ...prev.testimonials] } : prev,
            );
            notify('success', t('app.testimonialPublished'));
          }}
        />

        <VideoPlayerModal video={activeVideo} onClose={() => setActiveVideo(null)} />

        <WelcomeAnnouncementModal
          open={announcementOpen}
          announcement={welcomeAnnouncement}
          siteName={localizedPublicData.settings.general.siteName}
          onClose={handleDismissAnnouncement}
          onNavigate={navigate}
        />

        <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      </div>
    </CurrencyProvider>
  );
}
