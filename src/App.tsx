import { useCallback, useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { OrderDrawer, type BasketItem } from './components/OrderDrawer';
import { TestimonialModal } from './components/TestimonialModal';
import { ToastStack, type ToastItem } from './components/Toast';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { adminApi, authApi, getOrCreateClientKey, publicApi, visitorApi } from './lib/api';
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
  const [route, setRoute] = useState<string>(() => window.location.pathname + window.location.search);

  const [publicData, setPublicData] = useState<PublicBootstrapData | null>(null);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError, setPublicError] = useState('');

  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
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

  const fetchPublic = useCallback(async () => {
    try {
      const data = await publicApi.getBootstrap();
      setPublicData(data);
      setPublicError('');
      if (data.settings.general.siteName) {
        document.title = `${data.settings.general.siteName} — ${data.settings.general.tagline}`;
      }
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
      setPublicError(err instanceof Error ? err.message : 'Impossible de charger le site.');
    } finally {
      setPublicLoading(false);
    }
  }, []);

  const fetchAdmin = useCallback(async () => {
    const data = await adminApi.getBootstrap();
    setAdminData(data);
  }, []);

  useEffect(() => {
    void fetchPublic();
    visitorApi
      .me()
      .then((res) => {
        setVisitorUser(res.visitor);
        setVisitorOrders(res.orders);
      })
      .catch(() => {
        // Visitor not logged in
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

  useEffect(() => {
    if (!isAdminRoute) return;
    if (adminUser && adminData) return;
    let active = true;
    setAdminChecking(true);
    authApi
      .me()
      .then(async (res) => {
        if (!active) return;
        const data = await adminApi.getBootstrap();
        if (!active) return;
        setAdminData(data);
        setAdminUser(res.admin);
      })
      .catch(() => {
        if (!active) return;
        setAdminUser(null);
        setAdminData(null);
      })
      .finally(() => {
        if (active) setAdminChecking(false);
      });
    return () => {
      active = false;
    };
  }, [isAdminRoute, adminUser, adminData]);

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
      notify('success', `« ${product.name} » ajouté à votre sélection.`);
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
    setAdminData(data);
    setAdminUser(admin);
    notify('success', `Bienvenue, ${admin.name}.`);
  };

  const handleAdminLogout = async () => {
    await authApi.logout();
    setAdminUser(null);
    setAdminData(null);
    navigate('/');
    notify('success', 'Session administrateur fermée.');
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
      notify('success', res.liked ? 'Article ajouté à vos favoris.' : 'Mention « J’aime » retirée.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Action impossible.');
    }
  };

  const handleVisitorLogout = async () => {
    await visitorApi.logout();
    setVisitorUser(null);
    setVisitorOrders([]);
    notify('success', 'Vous êtes déconnecté de votre espace visiteur.');
  };

  // ---------------- ADMIN PORTAL RENDER ----------------
  if (isAdminRoute) {
    const siteName = adminData?.settings.general.siteName || publicData?.settings.general.siteName || 'Élias Varenne';

    if (adminChecking) {
      return (
        <div className="min-h-screen bg-[#F6F6F7] flex items-center justify-center text-sm text-[#5C5A55]">
          Vérification de la session...
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
          Chargement de l’espace administrateur...
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
          }}
          adminUser={adminUser}
          siteName={adminData.settings.general.siteName}
          newOrdersCount={newOrdersCount}
          unreadMessagesCount={unreadMessagesCount}
          onLogout={handleAdminLogout}
          onViewPublicSite={() => navigate('/')}
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
              selectedOrderId={selectedOrderId}
              onSelectOrder={setSelectedOrderId}
              onOrderUpdated={(updated) => {
                setAdminData((prev) =>
                  prev
                    ? { ...prev, orders: prev.orders.map((o) => (o.id === updated.id ? updated : o)) }
                    : prev,
                );
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
              onProductsChanged={(products) =>
                setAdminData((prev) => (prev ? { ...prev, products } : prev))
              }
              onMediaAdded={handleMediaAdded}
              onNotify={notify}
            />
          )}

          {adminSection === 'categories' && (
            <AdminCategoriesView
              categories={adminData.categories}
              products={adminData.products}
              media={adminData.media}
              onCategoriesChanged={(categories) =>
                setAdminData((prev) => (prev ? { ...prev, categories } : prev))
              }
              onMediaAdded={handleMediaAdded}
              onNotify={notify}
            />
          )}

          {adminSection === 'customers' && (
            <AdminCustomersView
              customers={adminData.customers}
              orders={adminData.orders}
              currencySymbol={adminData.settings.general.currencySymbol}
              onCustomerUpdated={(cust) =>
                setAdminData((prev) =>
                  prev
                    ? { ...prev, customers: prev.customers.map((c) => (c.id === cust.id ? cust : c)) }
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
              onArticlesChanged={(articles) =>
                setAdminData((prev) => (prev ? { ...prev, articles } : prev))
              }
              onArticleCategoriesChanged={(articleCategories) =>
                setAdminData((prev) => (prev ? { ...prev, articleCategories } : prev))
              }
              onMediaAdded={handleMediaAdded}
              onNotify={notify}
            />
          )}

          {adminSection === 'videos' && (
            <AdminVideosView
              videos={adminData.videos}
              onVideosChanged={(videos) =>
                setAdminData((prev) => (prev ? { ...prev, videos } : prev))
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
              onSettingsChanged={(settings) => {
                setAdminData((prev) => (prev ? { ...prev, settings } : prev));
                void fetchPublic();
              }}
              onAdminsChanged={(admins) =>
                setAdminData((prev) => (prev ? { ...prev, admins } : prev))
              }
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
        Chargement de l’espace...
      </div>
    );
  }

  if (publicError || !publicData) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <p className="font-display text-2xl font-semibold text-[#141413]">
          Connexion temporairement indisponible
        </p>
        <p className="mt-2 text-sm text-[#5C5A55]">{publicError}</p>
        <button
          type="button"
          onClick={() => void fetchPublic()}
          className="mt-5 px-5 py-2.5 bg-[#2A4036] text-white text-xs font-semibold rounded-lg"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const [pathname, queryStr] = route.split('?');
  const searchParams = new URLSearchParams(queryStr || '');
  const basketCount = basket.reduce((s, i) => s + i.quantity, 0);

  let pageView = (
    <HomePage
      data={publicData}
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
        data={publicData}
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
        data={publicData}
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
        data={publicData}
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
        data={publicData}
        actorKey={actorKey}
        onNavigate={navigate}
        onToggleArticleLike={(id) => void handleToggleArticleLike(id)}
      />
    );
  } else if (pathname === '/a-propos') {
    pageView = <AboutPage data={publicData} onNavigate={navigate} />;
  } else if (pathname === '/contact') {
    pageView = <ContactPage data={publicData} />;
  } else if (pathname === '/mon-compte') {
    pageView = (
      <VisitorAccountPage
        visitorUser={visitorUser}
        visitorOrders={visitorOrders}
        articles={publicData.articles}
        settings={publicData.settings}
        onAuthSuccess={(visitor, orders) => {
          setVisitorUser(visitor);
          setVisitorOrders(orders);
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
        settings={publicData.settings}
        visitorUser={visitorUser}
        initialOrderNumber={searchParams.get('num') || ''}
        initialContact={searchParams.get('contact') || ''}
        onNavigate={navigate}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#141413]">
      <Header
        currentPath={pathname}
        onNavigate={navigate}
        basketCount={basketCount}
        onOpenOrderDrawer={() => setOrderDrawerOpen(true)}
        settings={publicData.settings}
        visitorUser={visitorUser}
      />

      <main className="flex-1">{pageView}</main>

      <Footer onNavigate={navigate} settings={publicData.settings} />

      <OrderDrawer
        open={orderDrawerOpen}
        onClose={() => setOrderDrawerOpen(false)}
        items={basket}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearBasket={() => setBasket([])}
        allProducts={publicData.products}
        onAddProduct={(p) => handleAddToBasket(p, 1, false)}
        settings={publicData.settings}
        visitorUser={visitorUser}
        onNavigate={navigate}
        onOrderSuccess={(ord) => {
          notify('success', `Demande ${ord.orderNumber} enregistrée.`);
          if (visitorUser) {
            setVisitorOrders((prev) => [ord, ...prev]);
          }
          if (adminUser) void fetchAdmin();
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
          notify('success', 'Merci ! Votre témoignage a bien été publié.');
        }}
      />

      <VideoPlayerModal video={activeVideo} onClose={() => setActiveVideo(null)} />

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
