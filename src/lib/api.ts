import type {
  AdminBootstrapData,
  AdminUserPublic,
  Article,
  ArticleCategory,
  Category,
  ContactMessage,
  Customer,
  MediaFolder,
  MediaItem,
  Order,
  OrderStatus,
  Product,
  PublicBootstrapData,
  SiteContent,
  SiteSettings,
  Testimonial,
  TestimonialStatus,
  VideoItem,
  VisitorMemberPublic,
} from '../types/cms';

const TOKEN_KEY = 'ev_admin_token';
const VISITOR_TOKEN_KEY = 'ev_visitor_token';
const CLIENT_KEY_STORAGE = 'ev_client_key';

let memoryToken: string | null = null;
let memoryVisitorToken: string | null = null;
let memoryClientKey: string | null = null;

export function getStoredAdminToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    const fromSession = sessionStorage.getItem(TOKEN_KEY);
    if (fromSession) {
      memoryToken = fromSession;
      return fromSession;
    }
    const fromLocal = localStorage.getItem(TOKEN_KEY);
    if (fromLocal) {
      memoryToken = fromLocal;
      return fromLocal;
    }
    return null;
  } catch {
    return memoryToken;
  }
}

export function setStoredAdminToken(token: string | null): void {
  memoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted iframes; memoryToken remains active
  }
}

export function getStoredVisitorToken(): string | null {
  if (memoryVisitorToken) return memoryVisitorToken;
  try {
    const fromSession = sessionStorage.getItem(VISITOR_TOKEN_KEY);
    if (fromSession) {
      memoryVisitorToken = fromSession;
      return fromSession;
    }
    const fromLocal = localStorage.getItem(VISITOR_TOKEN_KEY);
    if (fromLocal) {
      memoryVisitorToken = fromLocal;
      return fromLocal;
    }
    return null;
  } catch {
    return memoryVisitorToken;
  }
}

export function setStoredVisitorToken(token: string | null): void {
  memoryVisitorToken = token;
  try {
    if (token) {
      sessionStorage.setItem(VISITOR_TOKEN_KEY, token);
      localStorage.setItem(VISITOR_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(VISITOR_TOKEN_KEY);
      localStorage.removeItem(VISITOR_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted iframes; memoryVisitorToken remains active
  }
}

export function getOrCreateClientKey(): string {
  if (memoryClientKey) return memoryClientKey;
  try {
    const existing = localStorage.getItem(CLIENT_KEY_STORAGE);
    if (existing) {
      memoryClientKey = existing;
      return existing;
    }
    const created = `ck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CLIENT_KEY_STORAGE, created);
    memoryClientKey = created;
    return created;
  } catch {
    if (!memoryClientKey) {
      memoryClientKey = `ck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }
    return memoryClientKey;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAdminToken();
  const visitorToken = getStoredVisitorToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (visitorToken) {
    headers['X-Visitor-Token'] = visitorToken;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Erreur serveur (${res.status})`);
  }
  return data as T;
}

export const publicApi = {
  getBootstrap: () => request<PublicBootstrapData>('/api/public/bootstrap'),
  createOrder: (payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    deliveryAddress: string;
    message: string;
    items: Array<{ productId: string; quantity: number }>;
  }) => request<{ order: Order }>('/api/public/orders', { method: 'POST', body: JSON.stringify(payload) }),
  sendContact: (payload: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) => request<{ message: ContactMessage }>('/api/public/contact', { method: 'POST', body: JSON.stringify(payload) }),
  trackOrder: (orderNumber: string, contact: string) =>
    request<{ order: Order }>('/api/public/orders/track', {
      method: 'POST',
      body: JSON.stringify({ orderNumber, contact }),
    }),
  toggleArticleLike: (articleId: string) =>
    request<{ article: Article; liked: boolean }>(`/api/public/articles/${articleId}/like`, {
      method: 'POST',
      body: JSON.stringify({ clientKey: getOrCreateClientKey() }),
    }),
  createTestimonial: (payload: {
    authorName: string;
    authorLocation: string;
    rating: number;
    content: string;
  }) =>
    request<{ testimonial: Testimonial }>('/api/public/testimonials', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const visitorApi = {
  register: async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) => {
    const res = await request<{ visitor: VisitorMemberPublic; orders: Order[]; token: string }>(
      '/api/visitor/register',
      { method: 'POST', body: JSON.stringify(payload) },
    );
    setStoredVisitorToken(res.token);
    return res;
  },
  login: async (email: string, password: string) => {
    const res = await request<{ visitor: VisitorMemberPublic; orders: Order[]; token: string }>(
      '/api/visitor/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    setStoredVisitorToken(res.token);
    return res;
  },
  logout: async () => {
    try {
      await request<{ ok: boolean }>('/api/visitor/logout', { method: 'POST' });
    } finally {
      setStoredVisitorToken(null);
    }
  },
  me: () => request<{ visitor: VisitorMemberPublic; orders: Order[] }>('/api/visitor/me'),
  updateProfile: (payload: { firstName: string; lastName: string; phone: string; address: string }) =>
    request<{ visitor: VisitorMemberPublic; orders: Order[] }>('/api/visitor/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await request<{ admin: AdminUserPublic; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredAdminToken(res.token);
    return res.admin;
  },
  logout: async () => {
    try {
      await request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredAdminToken(null);
    }
  },
  me: () => request<{ admin: AdminUserPublic }>('/api/auth/me'),
};

export const adminApi = {
  getBootstrap: () => request<AdminBootstrapData>('/api/admin/bootstrap'),

  updateOrder: (id: string, patch: { status?: OrderStatus; adminNotes?: string; statusNote?: string }) =>
    request<{ order: Order }>(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  updateCustomerNotes: (id: string, notes: string) =>
    request<{ customer: Customer }>(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }),

  createProduct: (payload: Partial<Product>) =>
    request<{ product: Product }>('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) }),

  updateProduct: (id: string, payload: Partial<Product>) =>
    request<{ product: Product }>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  duplicateProduct: (id: string) =>
    request<{ product: Product }>(`/api/admin/products/${id}/duplicate`, { method: 'POST' }),

  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/products/${id}`, { method: 'DELETE' }),

  createCategory: (payload: Partial<Category>) =>
    request<{ category: Category }>('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),

  updateCategory: (id: string, payload: Partial<Category>) =>
    request<{ category: Category }>(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  reorderCategories: (orderedIds: string[]) =>
    request<{ categories: Category[] }>('/api/admin/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    }),

  deleteCategory: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  createArticleCategory: (name: string) =>
    request<{ category: ArticleCategory }>('/api/admin/article-categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateArticleCategory: (id: string, name: string) =>
    request<{ category: ArticleCategory }>(`/api/admin/article-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  deleteArticleCategory: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/article-categories/${id}`, { method: 'DELETE' }),

  createArticle: (payload: Partial<Article>) =>
    request<{ article: Article }>('/api/admin/articles', { method: 'POST', body: JSON.stringify(payload) }),

  updateArticle: (id: string, payload: Partial<Article>) =>
    request<{ article: Article }>(`/api/admin/articles/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteArticle: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/articles/${id}`, { method: 'DELETE' }),

  lookupYoutube: (url: string) =>
    request<{ youtubeId: string; youtubeUrl: string; title: string; thumbnail: string }>(
      '/api/admin/youtube-lookup',
      { method: 'POST', body: JSON.stringify({ url }) },
    ),

  createVideo: (payload: Partial<VideoItem>) =>
    request<{ video: VideoItem }>('/api/admin/videos', { method: 'POST', body: JSON.stringify(payload) }),

  updateVideo: (id: string, payload: Partial<VideoItem>) =>
    request<{ video: VideoItem }>(`/api/admin/videos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  reorderVideos: (orderedIds: string[]) =>
    request<{ videos: VideoItem[] }>('/api/admin/videos/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    }),

  deleteVideo: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/videos/${id}`, { method: 'DELETE' }),

  uploadMedia: (payload: { name: string; folder: MediaFolder; dataUrl?: string; externalUrl?: string }) =>
    request<{ media: MediaItem }>('/api/admin/media/upload', { method: 'POST', body: JSON.stringify(payload) }),

  deleteMedia: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/media/${id}`, { method: 'DELETE' }),

  updateSiteContent: (content: SiteContent) =>
    request<{ siteContent: SiteContent }>('/api/admin/site-content', {
      method: 'PUT',
      body: JSON.stringify(content),
    }),

  updateSettings: (settings: SiteSettings) =>
    request<{ settings: SiteSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  createAdmin: (payload: { name: string; email: string; password: string; role: 'Super Administrateur' | 'Éditeur' }) =>
    request<{ admin: AdminUserPublic }>('/api/admin/admins', { method: 'POST', body: JSON.stringify(payload) }),

  deleteAdmin: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/admins/${id}`, { method: 'DELETE' }),

  changePassword: (newPassword: string) =>
    request<{ ok: boolean }>('/api/admin/admins/password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  markMessageRead: (id: string, read: boolean) =>
    request<{ message: ContactMessage }>(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
    }),

  deleteMessage: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/messages/${id}`, { method: 'DELETE' }),

  updateTestimonial: (id: string, patch: { status?: TestimonialStatus; featured?: boolean }) =>
    request<{ testimonial: Testimonial }>(`/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteTestimonial: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/testimonials/${id}`, { method: 'DELETE' }),
};
