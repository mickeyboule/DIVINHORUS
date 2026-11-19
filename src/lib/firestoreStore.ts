import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import type {
  ActivityLog,
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
  PublicOrderTrackingInfo,
  SiteContent,
  SiteSettings,
  Testimonial,
  VideoItem,
  VisitorMemberPublic,
} from '../types/cms';
import {
  auth,
  db,
  handleFirestoreError,
  isBootstrapAdminEmail,
  OperationType,
} from './firebase';

const MAX_INLINE_IMAGE_LEN = 345_000;
const MAX_MEDIA_URL_LEN = 740_000;

const DEMO_CATEGORY_IDS = new Set(['cat_encens', 'cat_huiles', 'cat_bougies', 'cat_pierres']);
const DEMO_PRODUCT_IDS = new Set([
  'prod_encens_cedre',
  'prod_huile_sauge',
  'prod_bougie_cire',
  'prod_pierres_ancrage',
  'prod_encens_sanctuaire',
  'prod_bol_contemplation',
]);
const DEMO_CUSTOMER_IDS = new Set(['cust_1', 'cust_2', 'cust_3', 'cust_4']);
const DEMO_ORDER_IDS = new Set(['ord_1041', 'ord_1042', 'ord_1043', 'ord_1044', 'ord_1045']);
const DEMO_ORDER_TRACKING_IDS = ['CMD-1041', 'CMD-1042', 'CMD-1043', 'CMD-1044', 'CMD-1045'];
const DEMO_ARTICLE_IDS = new Set([
  'art_silence_interieur',
  'art_rituel_ecriture',
  'art_matiere_sacree',
  'art_retraite_hiver',
]);
const DEMO_VIDEO_IDS = new Set(['vid_1', 'vid_2', 'vid_3']);
const DEMO_TESTIMONIAL_IDS = new Set(['test_1', 'test_2', 'test_3']);
const DEMO_MEDIA_IDS = new Set([
  'med_hero',
  'med_master',
  'med_incense',
  'med_oil',
  'med_candle',
  'med_stones',
  'med_art1',
  'med_art2',
  'med_05c03cec367d',
]);
const DEMO_CONTACT_MESSAGE_IDS = new Set(['msg_1']);
const DEMO_VISITOR_IDS = new Set(['vis_1']);
const DEMO_ACTIVITY_IDS = new Set(['act_1', 'act_2', 'act_3', 'act_4']);

function isIllustrativeAssetUrl(url: unknown): boolean {
  return (
    typeof url === 'string' &&
    (url.startsWith('/src/assets/images/') || url.startsWith('/uploads/'))
  );
}

function sanitizeSiteContentForDemo(raw: SiteContent): { cleaned: SiteContent; changed: boolean } {
  let changed = false;
  const hero = { ...raw.hero };
  if (isIllustrativeAssetUrl(hero.image)) {
    hero.image = '';
    changed = true;
  }

  const master = { ...raw.master };
  if (isIllustrativeAssetUrl(master.photo)) {
    master.photo = '';
    changed = true;
  }

  const aboutPage = { ...raw.aboutPage };
  if (isIllustrativeAssetUrl(aboutPage.image)) {
    aboutPage.image = '';
    changed = true;
  }

  let welcomeAnnouncement = raw.welcomeAnnouncement ? { ...raw.welcomeAnnouncement } : undefined;
  if (welcomeAnnouncement && isIllustrativeAssetUrl(welcomeAnnouncement.image)) {
    welcomeAnnouncement.image = '';
    changed = true;
  }

  const homeSections = { ...raw.homeSections };
  if (Array.isArray(homeSections.featuredProductIds)) {
    const filtered = homeSections.featuredProductIds.filter((id) => !DEMO_PRODUCT_IDS.has(id));
    if (filtered.length !== homeSections.featuredProductIds.length) {
      homeSections.featuredProductIds = filtered;
      changed = true;
    }
  }
  if (Array.isArray(homeSections.featuredArticleIds)) {
    const filtered = homeSections.featuredArticleIds.filter((id) => !DEMO_ARTICLE_IDS.has(id));
    if (filtered.length !== homeSections.featuredArticleIds.length) {
      homeSections.featuredArticleIds = filtered;
      changed = true;
    }
  }
  if (Array.isArray(homeSections.featuredVideoIds)) {
    const filtered = homeSections.featuredVideoIds.filter((id) => !DEMO_VIDEO_IDS.has(id));
    if (filtered.length !== homeSections.featuredVideoIds.length) {
      homeSections.featuredVideoIds = filtered;
      changed = true;
    }
  }

  return {
    changed,
    cleaned: {
      ...raw,
      hero,
      master,
      homeSections,
      aboutPage,
      ...(welcomeAnnouncement ? { welcomeAnnouncement } : {}),
    },
  };
}

export function isValidFirestoreId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
}

export function sanitizeFirestoreId(raw: string | undefined | null, fallbackPrefix = 'item'): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  if (cleaned && isValidFirestoreId(cleaned)) return cleaned;
  return `${fallbackPrefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function canUseFirestoreAdmin(): boolean {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return false;
  return isBootstrapAdminEmail(user.email);
}

export function canUseFirestoreVisitor(): boolean {
  const user = auth.currentUser;
  if (!user) return false;
  const isSocial = user.providerData.some(
    (p) => p.providerId === 'google.com' || p.providerId === 'facebook.com',
  );
  return Boolean(user.emailVerified || isSocial);
}

function toIsoString(value: unknown, fallback = ''): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return ((value as { toDate: () => Date }).toDate()).toISOString();
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function clampString(val: unknown, maxLen: number, fallback = ''): string {
  const str = typeof val === 'string' ? val : val == null ? fallback : String(val);
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function clampNumber(val: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Timestamp)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

async function hashNormalizedSegment(raw: string, length = 32): Promise<string> {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return '';
  try {
    const data = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex.slice(0, length);
  } catch {
    return normalized.replace(/[^a-z0-9]/g, '').slice(0, length);
  }
}

async function computeOrderContactHash(email?: string, phone?: string): Promise<string> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').replace(/\s+/g, '').toLowerCase();
  const [eHash, pHash] = await Promise.all([
    cleanEmail ? hashNormalizedSegment(cleanEmail, 32) : Promise.resolve(''),
    cleanPhone ? hashNormalizedSegment(cleanPhone, 32) : Promise.resolve(''),
  ]);
  return `${eHash}:${pHash}`;
}

async function matchesOrderContactHash(storedHash: string, contact: string): Promise<boolean> {
  if (!storedHash) return false;
  const cleanRaw = contact.trim().toLowerCase();
  const cleanNoSpaces = contact.replace(/\s+/g, '').toLowerCase();
  const [hRaw, hNoSpaces] = await Promise.all([
    hashNormalizedSegment(cleanRaw, 32),
    hashNormalizedSegment(cleanNoSpaces, 32),
  ]);
  const [eHash, pHash] = storedHash.split(':');
  return Boolean(
    (eHash && (eHash === hRaw || eHash === hNoSpaces)) ||
      (pHash && (pHash === hRaw || pHash === hNoSpaces)),
  );
}

// ---------------- SERIALIZERS (STRICTLY MATCHING FIRESTORE.RULES) ----------------

function buildCategoryUpdatable(cat: Category) {
  return {
    name: clampString(cat.name || 'Catégorie', 120, 'Catégorie'),
    slug: clampString(cat.slug || cat.id || 'categorie', 140, 'categorie'),
    description: clampString(cat.description || '', 1000, ''),
    image: clampString(cat.image || '', MAX_INLINE_IMAGE_LEN, ''),
    order: clampNumber(cat.order, 0, 10000, 0),
    visible: Boolean(cat.visible),
    updatedAt: serverTimestamp(),
  };
}

function buildProductUpdatable(prod: Product) {
  const validImages = (Array.isArray(prod.images) ? prod.images : [])
    .filter((img): img is string => typeof img === 'string' && img.length > 0 && img.length <= MAX_INLINE_IMAGE_LEN)
    .slice(0, 8);
  const availability = (
    ['En stock', 'Sur commande', 'Édition limitée', 'Rupture'] as const
  ).includes(prod.availability)
    ? prod.availability
    : 'En stock';
  return {
    reference: clampString(prod.reference || prod.id || 'REF', 80, 'REF'),
    name: clampString(prod.name || 'Produit', 180, 'Produit'),
    slug: clampString(prod.slug || prod.id || 'produit', 200, 'produit'),
    price: clampNumber(prod.price, 0, 10_000_000, 0),
    categoryId: sanitizeFirestoreId(prod.categoryId || 'cat_general', 'cat'),
    description: clampString(prod.description || '', 8000, ''),
    additionalInfo: clampString(prod.additionalInfo || '', 4000, ''),
    images: validImages,
    availability,
    stockCount: clampNumber(prod.stockCount, 0, 1_000_000, 0),
    featured: Boolean(prod.featured),
    active: Boolean(prod.active),
    orderCount: clampNumber(prod.orderCount, 0, 10_000_000, 0),
    updatedAt: serverTimestamp(),
  };
}

function buildArticleCategoryUpdatable(cat: ArticleCategory) {
  return {
    name: clampString(cat.name || 'Catégorie', 120, 'Catégorie'),
    slug: clampString(cat.slug || cat.id || 'categorie', 140, 'categorie'),
    updatedAt: serverTimestamp(),
  };
}

function buildArticleUpdatable(art: Article) {
  const status = art.status === 'Brouillon' ? 'Brouillon' : 'Publié';
  const likedByKeys = (Array.isArray(art.likedByKeys) ? art.likedByKeys : [])
    .filter((k): k is string => typeof k === 'string' && k.length <= 128)
    .slice(0, 500);
  return {
    title: clampString(art.title || 'Article', 220, 'Article'),
    slug: clampString(art.slug || art.id || 'article', 240, 'article'),
    excerpt: clampString(art.excerpt || '', 1200, ''),
    content: clampString(art.content || '', 50_000, ''),
    image: clampString(art.image || '', MAX_INLINE_IMAGE_LEN, ''),
    author: clampString(art.author || 'Maître Elias Varenne', 140, 'Maître Elias Varenne'),
    categoryId: sanitizeFirestoreId(art.categoryId || 'art_cat_general', 'art_cat'),
    status,
    featured: Boolean(art.featured),
    likesCount: clampNumber(art.likesCount, 0, 10_000_000, 0),
    likedByKeys,
    publishedAt: clampString(art.publishedAt || '', 64, ''),
    updatedAt: serverTimestamp(),
  };
}

function buildVideoUpdatable(vid: VideoItem) {
  return {
    title: clampString(vid.title || 'Vidéo', 220, 'Vidéo'),
    youtubeUrl: clampString(vid.youtubeUrl || `https://www.youtube.com/watch?v=${vid.youtubeId || 'dQw4w9WgXcQ'}`, 500),
    youtubeId: clampString(vid.youtubeId || 'dQw4w9WgXcQ', 64, 'dQw4w9WgXcQ'),
    thumbnail: clampString(vid.thumbnail || '', MAX_INLINE_IMAGE_LEN, ''),
    description: clampString(vid.description || '', 4000, ''),
    duration: clampString(vid.duration || '', 32, ''),
    visible: Boolean(vid.visible),
    featured: Boolean(vid.featured),
    sortOrder: clampNumber(vid.sortOrder, 0, 10_000, 0),
    updatedAt: serverTimestamp(),
  };
}

function buildTestimonialUpdatable(item: Testimonial) {
  const status = (['Publié', 'En attente', 'Masqué'] as const).includes(item.status)
    ? item.status
    : 'En attente';
  return {
    authorName: clampString(item.authorName || 'Membre', 120, 'Membre'),
    authorLocation: clampString(item.authorLocation || '', 120, ''),
    rating: clampNumber(item.rating, 1, 5, 5),
    content: clampString(item.content || 'Témoignage', 3000, 'Témoignage'),
    status,
    featured: Boolean(item.featured),
    updatedAt: serverTimestamp(),
  };
}

function buildCustomerUpdatable(cust: Customer) {
  return {
    firstName: clampString(cust.firstName || 'Client', 100, 'Client'),
    lastName: clampString(cust.lastName || 'Divin Horus', 100, 'Divin Horus'),
    phone: clampString(cust.phone || '', 60, ''),
    email: clampString(cust.email || '', 160, ''),
    country: clampString(cust.country || '', 80, ''),
    address: clampString(cust.address || '', 400, ''),
    notes: clampString(cust.notes || '', 4000, ''),
    lastOrderAt: clampString(cust.lastOrderAt || '', 64, ''),
    orderCount: clampNumber(cust.orderCount, 0, 1_000_000, 0),
    totalIndicative: clampNumber(cust.totalIndicative, 0, 100_000_000, 0),
    updatedAt: serverTimestamp(),
  };
}

function buildOrderPayload(order: Order, overrideVisitorId?: string) {
  const id = sanitizeFirestoreId(order.id, 'ord');
  const validStatus: OrderStatus = (
    ['Nouvelle', 'En cours', 'Confirmée', 'En expédition', 'Terminée', 'Annulée'] as const
  ).includes(order.status)
    ? order.status
    : 'Nouvelle';

  const safeItems = (Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
        {
          productId: 'prod_custom',
          productName: 'Article Divin Horus',
          productRef: 'DH',
          unitPrice: 0,
          quantity: 1,
          image: '',
        },
      ]
  )
    .slice(0, 50)
    .map((item) => ({
      productId: clampString(item.productId || 'prod', 128, 'prod'),
      productName: clampString(item.productName || 'Article', 200, 'Article'),
      productRef: clampString(item.productRef || '', 80, ''),
      unitPrice: clampNumber(item.unitPrice, 0, 100_000_000, 0),
      quantity: clampNumber(item.quantity, 1, 999, 1),
      image: clampString(item.image || '', MAX_INLINE_IMAGE_LEN, ''),
    }));

  const safeHistory = (Array.isArray(order.history) && order.history.length > 0
    ? order.history
    : [
        {
          status: validStatus,
          date: order.createdAt || new Date().toISOString(),
          note: 'Commande enregistrée',
          actor: 'Boutique',
        },
      ]
  )
    .slice(0, 40)
    .map((h) => ({
      status: h.status || validStatus,
      date: clampString(h.date || new Date().toISOString(), 64),
      note: clampString(h.note || '', 500),
      actor: clampString(h.actor || 'Système', 120),
    }));

  const payload: Record<string, unknown> = {
    id,
    orderNumber: clampString(order.orderNumber || id, 40, id),
    status: validStatus,
    customerId: clampString(order.customerId || 'cust_default', 128, 'cust_default'),
    visitorId: clampString(overrideVisitorId || order.visitorId || 'visitor_guest', 128, 'visitor_guest'),
    customerFirstName: clampString(order.customerFirstName || 'Client', 100, 'Client'),
    customerLastName: clampString(order.customerLastName || 'Boutique', 100, 'Boutique'),
    customerPhone: clampString(order.customerPhone || 'N/A', 60, 'N/A'),
    customerEmail: clampString(order.customerEmail || '', 160, ''),
    customerCountry: clampString(order.customerCountry || '', 80, ''),
    deliveryAddress: clampString(order.deliveryAddress || '', 500, ''),
    message: clampString(order.message || '', 2000, ''),
    items: safeItems,
    subtotal: clampNumber(order.subtotal ?? order.indicativeTotal, 0, 100_000_000, 0),
    shippingFee: clampNumber(order.shippingFee ?? 0, 0, 1_000_000, 0),
    indicativeTotal: clampNumber(order.indicativeTotal, 0, 100_000_000, 0),
    displayCurrencyCode: clampString(order.displayCurrencyCode || '', 16, ''),
    displayCurrencySymbol: clampString(order.displayCurrencySymbol || '', 16, ''),
    displayTotal: clampNumber(order.displayTotal ?? order.indicativeTotal, 0, 10_000_000_000, 0),
    adminNotes: clampString(order.adminNotes || '', 4000, ''),
    history: safeHistory,
  };

  if (order.invoice) {
    payload.invoice = stripUndefinedDeep(order.invoice);
  }

  return { id, payload, safeHistory, validStatus };
}

function buildSiteContentUpdatable(content: SiteContent) {
  const safeWelcome = content.welcomeAnnouncement
    ? stripUndefinedDeep({
        ...content.welcomeAnnouncement,
        image: clampString(content.welcomeAnnouncement.image || '', MAX_INLINE_IMAGE_LEN, ''),
      })
    : {
        enabled: false,
        type: 'welcome',
        title: '',
        message: '',
        displayFrequency: 'once_per_update',
        version: 'v1',
      };

  const safeMaster = stripUndefinedDeep({
    ...content.master,
    photo: clampString(content.master?.photo || '', MAX_INLINE_IMAGE_LEN, ''),
  });

  const safeHero = stripUndefinedDeep({
    ...content.hero,
    image: clampString(content.hero?.image || '', MAX_INLINE_IMAGE_LEN, ''),
  });

  const safeAbout = stripUndefinedDeep({
    ...content.aboutPage,
    image: clampString(content.aboutPage?.image || '', MAX_INLINE_IMAGE_LEN, ''),
  });

  return {
    hero: safeHero,
    master: safeMaster,
    homeSections: stripUndefinedDeep(content.homeSections || {}),
    aboutPage: safeAbout,
    contactPage: stripUndefinedDeep(content.contactPage || {}),
    welcomeAnnouncement: safeWelcome,
    updatedAt: serverTimestamp(),
  };
}

function buildSiteSettingsUpdatable(settings: SiteSettings) {
  const safeGeneral = stripUndefinedDeep({
    ...settings.general,
    logoUrl: clampString(settings.general?.logoUrl || '', MAX_INLINE_IMAGE_LEN, ''),
    faviconUrl: clampString(settings.general?.faviconUrl || '', MAX_INLINE_IMAGE_LEN, ''),
  });

  const safeYoutubeSync = stripUndefinedDeep(
    settings.youtubeSync || {
      channelUrl: '',
      channelId: '',
      autoSync: false,
      lastSyncAt: null,
    },
  );

  return {
    general: safeGeneral,
    contact: stripUndefinedDeep(settings.contact || {}),
    socials: stripUndefinedDeep(settings.socials || {}),
    youtubeSync: safeYoutubeSync,
    orderSettings: stripUndefinedDeep(settings.orderSettings || {}),
    updatedAt: serverTimestamp(),
  };
}

// ---------------- HYDRATION FROM FIRESTORE ----------------

function mapCategory(data: DocumentData): Category {
  return {
    id: String(data.id),
    name: String(data.name || ''),
    slug: String(data.slug || ''),
    description: String(data.description || ''),
    image: String(data.image || ''),
    order: Number(data.order ?? 0),
    visible: Boolean(data.visible),
    createdAt: toIsoString(data.createdAt, new Date().toISOString()),
  };
}

function mapProduct(data: DocumentData): Product {
  const createdAt = toIsoString(data.createdAt, new Date().toISOString());
  return {
    id: String(data.id),
    reference: String(data.reference || ''),
    name: String(data.name || ''),
    slug: String(data.slug || ''),
    price: Number(data.price ?? 0),
    categoryId: String(data.categoryId || ''),
    description: String(data.description || ''),
    additionalInfo: String(data.additionalInfo || ''),
    images: Array.isArray(data.images) ? data.images.map(String) : [],
    availability: (data.availability as Product['availability']) || 'En stock',
    stockCount: Number(data.stockCount ?? 0),
    featured: Boolean(data.featured),
    active: Boolean(data.active),
    orderCount: Number(data.orderCount ?? 0),
    createdAt,
    updatedAt: toIsoString(data.updatedAt, createdAt),
  };
}

function mapArticleCategory(data: DocumentData): ArticleCategory {
  return {
    id: String(data.id),
    name: String(data.name || ''),
    slug: String(data.slug || ''),
  };
}

function mapArticle(data: DocumentData): Article {
  const createdAt = toIsoString(data.createdAt, new Date().toISOString());
  return {
    id: String(data.id),
    title: String(data.title || ''),
    slug: String(data.slug || ''),
    excerpt: String(data.excerpt || ''),
    content: String(data.content || ''),
    image: String(data.image || ''),
    author: String(data.author || ''),
    categoryId: String(data.categoryId || ''),
    status: (data.status as Article['status']) || 'Publié',
    featured: Boolean(data.featured),
    likesCount: Number(data.likesCount ?? 0),
    likedByKeys: Array.isArray(data.likedByKeys) ? data.likedByKeys.map(String) : [],
    publishedAt: String(data.publishedAt || createdAt),
    createdAt,
    updatedAt: toIsoString(data.updatedAt, createdAt),
  };
}

function mapVideo(data: DocumentData): VideoItem {
  return {
    id: String(data.id),
    title: String(data.title || ''),
    youtubeUrl: String(data.youtubeUrl || ''),
    youtubeId: String(data.youtubeId || ''),
    thumbnail: String(data.thumbnail || ''),
    description: String(data.description || ''),
    duration: String(data.duration || ''),
    visible: Boolean(data.visible),
    featured: Boolean(data.featured),
    sortOrder: Number(data.sortOrder ?? 0),
    createdAt: toIsoString(data.createdAt, new Date().toISOString()),
  };
}

function mapTestimonial(data: DocumentData): Testimonial {
  return {
    id: String(data.id),
    authorName: String(data.authorName || ''),
    authorLocation: String(data.authorLocation || ''),
    rating: Number(data.rating ?? 5),
    content: String(data.content || ''),
    status: (data.status as Testimonial['status']) || 'En attente',
    featured: Boolean(data.featured),
    visitorId: data.visitorId ? String(data.visitorId) : undefined,
    createdAt: toIsoString(data.createdAt, new Date().toISOString()),
  };
}

function mapMedia(data: DocumentData): MediaItem {
  const folder: MediaFolder = (['produits', 'articles', 'categories', 'site'] as const).includes(
    data.folder,
  )
    ? data.folder
    : 'site';
  return {
    id: String(data.id),
    name: String(data.name || ''),
    url: String(data.url || ''),
    folder,
    sizeLabel: String(data.sizeLabel || ''),
    createdAt: toIsoString(data.createdAt, new Date().toISOString()),
  };
}

function mapCustomer(data: DocumentData): Customer {
  return {
    id: String(data.id),
    firstName: String(data.firstName || ''),
    lastName: String(data.lastName || ''),
    phone: String(data.phone || ''),
    email: String(data.email || ''),
    country: data.country ? String(data.country) : undefined,
    address: String(data.address || ''),
    notes: String(data.notes || ''),
    createdAt: toIsoString(data.createdAt, new Date().toISOString()),
    lastOrderAt: String(data.lastOrderAt || ''),
    orderCount: Number(data.orderCount ?? 0),
    totalIndicative: Number(data.totalIndicative ?? 0),
  };
}

function mapOrder(data: DocumentData): Order {
  const createdAt = toIsoString(data.createdAt, new Date().toISOString());
  return {
    id: String(data.id),
    orderNumber: String(data.orderNumber || ''),
    createdAt,
    updatedAt: toIsoString(data.updatedAt, createdAt),
    status: (data.status as OrderStatus) || 'Nouvelle',
    customerId: String(data.customerId || ''),
    visitorId: data.visitorId ? String(data.visitorId) : undefined,
    customerFirstName: String(data.customerFirstName || ''),
    customerLastName: String(data.customerLastName || ''),
    customerPhone: String(data.customerPhone || ''),
    customerEmail: String(data.customerEmail || ''),
    customerCountry: data.customerCountry ? String(data.customerCountry) : undefined,
    deliveryAddress: String(data.deliveryAddress || ''),
    message: String(data.message || ''),
    items: Array.isArray(data.items) ? (data.items as Order['items']) : [],
    subtotal: data.subtotal !== undefined ? Number(data.subtotal) : undefined,
    shippingFee: data.shippingFee !== undefined ? Number(data.shippingFee) : undefined,
    indicativeTotal: Number(data.indicativeTotal ?? 0),
    displayCurrencyCode: data.displayCurrencyCode ? String(data.displayCurrencyCode) : undefined,
    displayCurrencySymbol: data.displayCurrencySymbol
      ? String(data.displayCurrencySymbol)
      : undefined,
    displayTotal: data.displayTotal !== undefined ? Number(data.displayTotal) : undefined,
    adminNotes: String(data.adminNotes || ''),
    history: Array.isArray(data.history) ? (data.history as Order['history']) : [],
    ...(data.invoice ? { invoice: data.invoice as Order['invoice'] } : {}),
  };
}

function mapVisitor(data: DocumentData): VisitorMemberPublic {
  return {
    id: String(data.id),
    firstName: String(data.firstName || ''),
    lastName: String(data.lastName || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    address: String(data.address || ''),
    country: data.country ? String(data.country) : undefined,
    createdAt: toIsoString(data.createdAt, new Date().toISOString()),
  };
}

function mapContactMessage(data: DocumentData): ContactMessage {
  return {
    id: String(data.id),
    name: String(data.name || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    subject: String(data.subject || ''),
    message: String(data.message || ''),
    read: Boolean(data.read),
    createdAt: toIsoString(data.createdAt, new Date().toISOString()),
  };
}

function mapAdminMember(data: DocumentData): AdminUserPublic {
  return {
    id: String(data.id),
    name: String(data.name || ''),
    email: String(data.email || ''),
    role: data.role === 'Éditeur' ? 'Éditeur' : 'Super Administrateur',
    createdAt: toIsoString(data.createdAt, new Date().toISOString()),
    lastLoginAt: null,
  };
}

function mapActivity(data: DocumentData): ActivityLog {
  return {
    id: String(data.id),
    actorName: String(data.actorName || ''),
    action: String(data.action || ''),
    target: String(data.target || ''),
    category: (data.category as ActivityLog['category']) || 'contenu',
    createdAt: toIsoString(data.createdAt, new Date().toISOString()),
  };
}

// ---------------- PUBLIC FIRESTORE READS & WRITES ----------------

export async function loadPublicFromFirestore(): Promise<PublicBootstrapData | null> {
  try {
    const [contentSnap, settingsSnap] = await Promise.all([
      getDoc(doc(db, 'site_content', 'main')),
      getDoc(doc(db, 'site_settings', 'public')),
    ]);

    if (!contentSnap.exists() || !settingsSnap.exists()) {
      return null;
    }

    const [catSnap, prodSnap, artCatSnap, artSnap, vidSnap, testSnap] = await Promise.all([
      getDocs(query(collection(db, 'categories'), where('visible', '==', true))),
      getDocs(query(collection(db, 'products'), where('active', '==', true))),
      getDocs(collection(db, 'article_categories')),
      getDocs(query(collection(db, 'articles'), where('status', '==', 'Publié'))),
      getDocs(query(collection(db, 'videos'), where('visible', '==', true))),
      getDocs(query(collection(db, 'testimonials'), where('status', '==', 'Publié'))),
    ]);

    const cData = contentSnap.data();
    const sData = settingsSnap.data();

    const categories = catSnap.docs
      .map((d) => mapCategory(d.data()))
      .filter((c) => !DEMO_CATEGORY_IDS.has(c.id))
      .sort((a, b) => a.order - b.order);
    const products = prodSnap.docs
      .map((d) => mapProduct(d.data()))
      .filter((p) => !DEMO_PRODUCT_IDS.has(p.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const articleCategories = artCatSnap.docs.map((d) => mapArticleCategory(d.data()));
    const articles = artSnap.docs
      .map((d) => mapArticle(d.data()))
      .filter((a) => !DEMO_ARTICLE_IDS.has(a.id))
      .sort((a, b) => (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt));
    const videos = vidSnap.docs
      .map((d) => mapVideo(d.data()))
      .filter((v) => !DEMO_VIDEO_IDS.has(v.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const testimonials = testSnap.docs
      .map((d) => mapTestimonial(d.data()))
      .filter((t) => !DEMO_TESTIMONIAL_IDS.has(t.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const rawSiteContent: SiteContent = {
      hero: cData.hero as SiteContent['hero'],
      master: cData.master as SiteContent['master'],
      homeSections: cData.homeSections as SiteContent['homeSections'],
      aboutPage: cData.aboutPage as SiteContent['aboutPage'],
      contactPage: cData.contactPage as SiteContent['contactPage'],
      ...(cData.welcomeAnnouncement
        ? { welcomeAnnouncement: cData.welcomeAnnouncement as SiteContent['welcomeAnnouncement'] }
        : {}),
    };
    const { cleaned: siteContent } = sanitizeSiteContentForDemo(rawSiteContent);

    const settings: SiteSettings = {
      general: sData.general as SiteSettings['general'],
      contact: sData.contact as SiteSettings['contact'],
      socials: sData.socials as SiteSettings['socials'],
      ...(sData.youtubeSync ? { youtubeSync: sData.youtubeSync as SiteSettings['youtubeSync'] } : {}),
      orderSettings: sData.orderSettings as SiteSettings['orderSettings'],
    };

    return {
      categories,
      products,
      articleCategories,
      articles,
      videos,
      testimonials,
      siteContent,
      settings,
    };
  } catch (err) {
    console.warn('Firestore public read fallback:', err);
    return null;
  }
}

export async function trackOrderFromFirestore(
  orderNumber: string,
  contact: string,
): Promise<PublicOrderTrackingInfo | null> {
  const cleanOrderNum = orderNumber.trim().toUpperCase();
  if (!isValidFirestoreId(cleanOrderNum)) return null;
  try {
    const snap = await getDoc(doc(db, 'order_tracking', cleanOrderNum));
    if (!snap.exists()) return null;
    const data = snap.data();
    const matched = await matchesOrderContactHash(String(data.contactHash || ''), contact);
    if (!matched) return null;
    const createdAt = toIsoString(data.createdAt, new Date().toISOString());
    return {
      id: cleanOrderNum,
      orderNumber: String(data.orderNumber || cleanOrderNum),
      createdAt,
      updatedAt: toIsoString(data.updatedAt, createdAt),
      status: (data.status as OrderStatus) || 'Nouvelle',
      customerFirstName: String(data.customerFirstName || ''),
      customerLastName: String(data.customerLastName || ''),
      history: Array.isArray(data.history) ? (data.history as PublicOrderTrackingInfo['history']) : [],
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `order_tracking/${cleanOrderNum}`);
  }
}

// ---------------- VISITOR FIRESTORE SYNC ----------------

export async function syncVisitorToFirestore(visitor: VisitorMemberPublic): Promise<void> {
  const user = auth.currentUser;
  if (!user || !canUseFirestoreVisitor()) return;
  const uid = sanitizeFirestoreId(user.uid, 'usr');
  const ref = doc(db, 'visitors', uid);
  const updatable = {
    firstName: clampString(visitor.firstName || 'Membre', 100, 'Membre'),
    lastName: clampString(visitor.lastName || 'Divin Horus', 100, 'Divin Horus'),
    phone: clampString(visitor.phone || '', 60, ''),
    address: clampString(visitor.address || '', 400, ''),
    country: clampString(visitor.country || '', 80, ''),
    updatedAt: serverTimestamp(),
  };
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, {
        id: uid,
        email: clampString(visitor.email || user.email || 'membre@divinhorus.com', 160),
        ...updatable,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `visitors/${uid}`);
  }
}

export async function getOrdersForVisitorFromFirestore(): Promise<Order[] | null> {
  const user = auth.currentUser;
  if (!user || !canUseFirestoreVisitor()) return null;
  try {
    const snap = await getDocs(
      query(collection(db, 'orders'), where('visitorId', '==', user.uid)),
    );
    return snap.docs
      .map((d) => mapOrder(d.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    console.warn('Firestore visitor orders read fallback:', err);
    return null;
  }
}

export async function saveOrderToFirestore(order: Order): Promise<void> {
  const user = auth.currentUser;
  if (!user || (!canUseFirestoreVisitor() && !canUseFirestoreAdmin())) return;

  const isAdmin = canUseFirestoreAdmin();
  const visitorUid = isAdmin ? order.visitorId || user.uid : user.uid;
  const sanitizedOrder: Order = isAdmin
    ? order
    : {
        ...order,
        status: 'Nouvelle',
        adminNotes: '',
        invoice: undefined,
      };
  const { id, payload, safeHistory, validStatus } = buildOrderPayload(sanitizedOrder, visitorUid);
  const orderNumber = sanitizeFirestoreId(String(payload.orderNumber), 'CMD');
  const contactHash = await computeOrderContactHash(
    String(payload.customerEmail || ''),
    String(payload.customerPhone || ''),
  );

  const orderRef = doc(db, 'orders', id);
  const trackingRef = doc(db, 'order_tracking', orderNumber);

  try {
    const batch = writeBatch(db);
    batch.set(orderRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(trackingRef, {
      orderNumber,
      status: validStatus,
      customerFirstName: clampString(payload.customerFirstName, 100),
      customerLastName: clampString(payload.customerLastName, 100),
      contactHash,
      history: safeHistory,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${id}`);
  }
}

export async function saveTestimonialFromVisitorToFirestore(item: Testimonial): Promise<void> {
  const user = auth.currentUser;
  if (!user || !canUseFirestoreVisitor()) return;
  const id = sanitizeFirestoreId(item.id, 'test');
  const isAdmin = canUseFirestoreAdmin();
  const ref = doc(db, 'testimonials', id);
  try {
    await setDoc(ref, {
      id,
      authorName: clampString(item.authorName || 'Membre', 120, 'Membre'),
      authorLocation: clampString(item.authorLocation || '', 120, ''),
      rating: clampNumber(item.rating, 1, 5, 5),
      content: clampString(item.content || 'Témoignage', 3000, 'Témoignage'),
      status: isAdmin ? item.status || 'En attente' : 'En attente',
      featured: isAdmin ? Boolean(item.featured) : false,
      visitorId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `testimonials/${id}`);
  }
}

export async function saveContactMessageToFirestore(msg: ContactMessage): Promise<void> {
  const user = auth.currentUser;
  if (!user || (!canUseFirestoreVisitor() && !canUseFirestoreAdmin())) return;
  const id = sanitizeFirestoreId(msg.id, 'msg');
  const ref = doc(db, 'contact_messages', id);
  try {
    await setDoc(ref, {
      id,
      senderUid: user.uid,
      name: clampString(msg.name || 'Visiteur', 140, 'Visiteur'),
      email: clampString(msg.email || user.email || 'contact@divinhorus.com', 160),
      phone: clampString(msg.phone || '', 60, ''),
      subject: clampString(msg.subject || 'Message depuis le site', 200),
      message: clampString(msg.message || '-', 5000, '-'),
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `contact_messages/${id}`);
  }
}

// ---------------- ADMIN FIRESTORE READS & AUTO-MIGRATION ----------------

export async function loadAdminFromFirestore(
  fallbackSeed?: AdminBootstrapData,
): Promise<AdminBootstrapData | null> {
  if (!canUseFirestoreAdmin()) return null;

  try {
    const [contentSnap, settingsSnap] = await Promise.all([
      getDoc(doc(db, 'site_content', 'main')),
      getDoc(doc(db, 'site_settings', 'public')),
    ]);

    if ((!contentSnap.exists() || !settingsSnap.exists()) && fallbackSeed) {
      await migrateBootstrapToFirestore(fallbackSeed);
    }

    const [
      catSnap,
      prodSnap,
      ordSnap,
      custSnap,
      artCatSnap,
      artSnap,
      vidSnap,
      testSnap,
      visSnap,
      mediaSnap,
      finalContentSnap,
      finalSettingsSnap,
      admSnap,
      actSnap,
      msgSnap,
    ] = await Promise.all([
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'article_categories')),
      getDocs(collection(db, 'articles')),
      getDocs(collection(db, 'videos')),
      getDocs(collection(db, 'testimonials')),
      getDocs(collection(db, 'visitors')),
      getDocs(collection(db, 'media')),
      getDoc(doc(db, 'site_content', 'main')),
      getDoc(doc(db, 'site_settings', 'public')),
      getDocs(collection(db, 'admins')),
      getDocs(collection(db, 'activities')),
      getDocs(collection(db, 'contact_messages')),
    ]);

    if (!finalContentSnap.exists() || !finalSettingsSnap.exists()) {
      return fallbackSeed ?? null;
    }

    const cData = finalContentSnap.data();
    const sData = finalSettingsSnap.data();

    const adminsFromDb = admSnap.docs.map((d) => mapAdminMember(d.data()));
    const admins = adminsFromDb.length > 0 ? adminsFromDb : fallbackSeed?.admins || [];

    const rawSiteContent: SiteContent = {
      hero: cData.hero as SiteContent['hero'],
      master: cData.master as SiteContent['master'],
      homeSections: cData.homeSections as SiteContent['homeSections'],
      aboutPage: cData.aboutPage as SiteContent['aboutPage'],
      contactPage: cData.contactPage as SiteContent['contactPage'],
      ...(cData.welcomeAnnouncement
        ? { welcomeAnnouncement: cData.welcomeAnnouncement as SiteContent['welcomeAnnouncement'] }
        : {}),
    };
    const { cleaned: cleanedSiteContent, changed: siteContentHadDemo } =
      sanitizeSiteContentForDemo(rawSiteContent);

    // Purge any lingering illustrative demo docs from Firestore automatically when admin loads
    const demoDeleteTasks: Array<() => Promise<void>> = [];
    for (const d of catSnap.docs) {
      if (DEMO_CATEGORY_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'categories', d.id)));
      }
    }
    for (const d of prodSnap.docs) {
      if (DEMO_PRODUCT_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'products', d.id)));
      }
    }
    for (const d of ordSnap.docs) {
      if (DEMO_ORDER_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'orders', d.id)));
      }
    }
    for (const d of custSnap.docs) {
      if (DEMO_CUSTOMER_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'customers', d.id)));
      }
    }
    for (const d of artSnap.docs) {
      if (DEMO_ARTICLE_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'articles', d.id)));
      }
    }
    for (const d of vidSnap.docs) {
      if (DEMO_VIDEO_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'videos', d.id)));
      }
    }
    for (const d of testSnap.docs) {
      if (DEMO_TESTIMONIAL_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'testimonials', d.id)));
      }
    }
    for (const d of visSnap.docs) {
      if (DEMO_VISITOR_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'visitors', d.id)));
      }
    }
    for (const d of mediaSnap.docs) {
      const mUrl = d.data()?.url;
      if (DEMO_MEDIA_IDS.has(d.id) || isIllustrativeAssetUrl(mUrl)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'media', d.id)));
      }
    }
    for (const d of msgSnap.docs) {
      if (DEMO_CONTACT_MESSAGE_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'contact_messages', d.id)));
      }
    }
    for (const d of actSnap.docs) {
      if (DEMO_ACTIVITY_IDS.has(d.id)) {
        demoDeleteTasks.push(() => deleteDoc(doc(db, 'activities', d.id)));
      }
    }

    let needsTrackingCleanup = ordSnap.docs.some((d) => DEMO_ORDER_IDS.has(d.id));
    try {
      if (typeof window !== 'undefined' && !window.localStorage.getItem('dh_demo_purged_v1')) {
        needsTrackingCleanup = true;
      }
    } catch {
      // Ignore storage restrictions
    }
    if (needsTrackingCleanup) {
      for (const orderNum of DEMO_ORDER_TRACKING_IDS) {
        demoDeleteTasks.push(async () => {
          try {
            await deleteDoc(doc(db, 'order_tracking', orderNum));
          } catch {
            // Ignore missing tracking doc
          }
        });
      }
    }

    if (demoDeleteTasks.length > 0) {
      for (let i = 0; i < demoDeleteTasks.length; i += 8) {
        await Promise.all(demoDeleteTasks.slice(i, i + 8).map((fn) => fn()));
      }
    }
    if (siteContentHadDemo) {
      await saveSiteContentToFirestore(cleanedSiteContent);
    }
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('dh_demo_purged_v1', '1');
      }
    } catch {
      // Ignore storage restrictions
    }

    return {
      categories: catSnap.docs
        .map((d) => mapCategory(d.data()))
        .filter((c) => !DEMO_CATEGORY_IDS.has(c.id))
        .sort((a, b) => a.order - b.order),
      products: prodSnap.docs
        .map((d) => mapProduct(d.data()))
        .filter((p) => !DEMO_PRODUCT_IDS.has(p.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      orders: ordSnap.docs
        .map((d) => mapOrder(d.data()))
        .filter((o) => !DEMO_ORDER_IDS.has(o.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      customers: custSnap.docs
        .map((d) => mapCustomer(d.data()))
        .filter((c) => !DEMO_CUSTOMER_IDS.has(c.id))
        .sort((a, b) => (b.lastOrderAt || b.createdAt).localeCompare(a.lastOrderAt || a.createdAt)),
      articleCategories: artCatSnap.docs.map((d) => mapArticleCategory(d.data())),
      articles: artSnap.docs
        .map((d) => mapArticle(d.data()))
        .filter((a) => !DEMO_ARTICLE_IDS.has(a.id))
        .sort((a, b) => (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt)),
      videos: vidSnap.docs
        .map((d) => mapVideo(d.data()))
        .filter((v) => !DEMO_VIDEO_IDS.has(v.id))
        .sort((a, b) => a.sortOrder - b.sortOrder),
      testimonials: testSnap.docs
        .map((d) => mapTestimonial(d.data()))
        .filter((t) => !DEMO_TESTIMONIAL_IDS.has(t.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      visitors: visSnap.docs
        .map((d) => mapVisitor(d.data()))
        .filter((v) => !DEMO_VISITOR_IDS.has(v.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      media: mediaSnap.docs
        .map((d) => mapMedia(d.data()))
        .filter((m) => !DEMO_MEDIA_IDS.has(m.id) && !isIllustrativeAssetUrl(m.url))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      siteContent: cleanedSiteContent,
      settings: {
        general: sData.general as SiteSettings['general'],
        contact: sData.contact as SiteSettings['contact'],
        socials: sData.socials as SiteSettings['socials'],
        ...(sData.youtubeSync
          ? { youtubeSync: sData.youtubeSync as SiteSettings['youtubeSync'] }
          : {}),
        orderSettings: sData.orderSettings as SiteSettings['orderSettings'],
      },
      admins,
      activities: actSnap.docs
        .map((d) => mapActivity(d.data()))
        .filter((a) => !DEMO_ACTIVITY_IDS.has(a.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 60),
      contactMessages: msgSnap.docs
        .map((d) => mapContactMessage(d.data()))
        .filter((m) => !DEMO_CONTACT_MESSAGE_IDS.has(m.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'admin_bootstrap');
  }
}

export async function migrateBootstrapToFirestore(seed: AdminBootstrapData): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const uid = auth.currentUser!.uid;

  try {
    const writes: Array<() => Promise<void>> = [];

    for (const cat of seed.categories) {
      writes.push(() => saveCategoryToFirestore(cat));
    }
    for (const prod of seed.products) {
      writes.push(() => saveProductToFirestore(prod));
    }
    for (const ac of seed.articleCategories) {
      writes.push(() => saveArticleCategoryToFirestore(ac));
    }
    for (const art of seed.articles) {
      writes.push(() => saveArticleToFirestore(art));
    }
    for (const vid of seed.videos) {
      writes.push(() => saveVideoToFirestore(vid));
    }
    for (const test of seed.testimonials) {
      writes.push(() => saveTestimonialToFirestore(test));
    }
    for (const media of seed.media) {
      writes.push(() => saveMediaToFirestore(media, uid));
    }
    for (const cust of seed.customers) {
      writes.push(() => saveCustomerToFirestore(cust));
    }
    for (const ord of seed.orders) {
      writes.push(() => upsertOrderAdminToFirestore(ord));
    }
    for (const vis of seed.visitors) {
      const vid = sanitizeFirestoreId(vis.id, 'vis');
      writes.push(async () => {
        const ref = doc(db, 'visitors', vid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            id: vid,
            firstName: clampString(vis.firstName || 'Membre', 100, 'Membre'),
            lastName: clampString(vis.lastName || 'Divin Horus', 100, 'Divin Horus'),
            email: clampString(vis.email || 'membre@divinhorus.com', 160),
            phone: clampString(vis.phone || '', 60, ''),
            address: clampString(vis.address || '', 400, ''),
            country: clampString(vis.country || '', 80, ''),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
    }
    for (const msg of seed.contactMessages) {
      const mid = sanitizeFirestoreId(msg.id, 'msg');
      writes.push(async () => {
        const ref = doc(db, 'contact_messages', mid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            id: mid,
            senderUid: uid,
            name: clampString(msg.name || 'Visiteur', 140, 'Visiteur'),
            email: clampString(msg.email || 'contact@divinhorus.com', 160),
            phone: clampString(msg.phone || '', 60, ''),
            subject: clampString(msg.subject || 'Message', 200),
            message: clampString(msg.message || '-', 5000, '-'),
            read: Boolean(msg.read),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
    }

    writes.push(() => saveSiteContentToFirestore(seed.siteContent));
    writes.push(() => saveSiteSettingsToFirestore(seed.settings));

    // Register current verified Firebase admin in /admins/{uid}
    writes.push(async () => {
      const admRef = doc(db, 'admins', sanitizeFirestoreId(uid, 'adm'));
      const snap = await getDoc(admRef);
      if (!snap.exists()) {
        await setDoc(admRef, {
          id: sanitizeFirestoreId(uid, 'adm'),
          name: clampString(auth.currentUser?.displayName || 'Administrateur Divin Horus', 120),
          email: clampString(auth.currentUser?.email || 'bisnessweb24@gmail.com', 160),
          role: 'Super Administrateur',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    for (let i = 0; i < writes.length; i += 6) {
      await Promise.all(writes.slice(i, i + 6).map((fn) => fn()));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'migration');
  }
}

// ---------------- ADMIN FIRESTORE CRUD WRITERS ----------------

export async function saveCategoryToFirestore(cat: Category): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(cat.id, 'cat');
  const ref = doc(db, 'categories', id);
  const updatable = buildCategoryUpdatable({ ...cat, id });
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, { id, ...updatable, createdAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
  }
}

export async function deleteCategoryFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'cat');
  try {
    await deleteDoc(doc(db, 'categories', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `categories/${cleanId}`);
  }
}

export async function saveProductToFirestore(prod: Product): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(prod.id, 'prod');
  const ref = doc(db, 'products', id);
  const updatable = buildProductUpdatable({ ...prod, id });
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, { id, ...updatable, createdAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
  }
}

export async function deleteProductFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'prod');
  try {
    await deleteDoc(doc(db, 'products', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${cleanId}`);
  }
}

export async function saveArticleCategoryToFirestore(cat: ArticleCategory): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(cat.id, 'art_cat');
  const ref = doc(db, 'article_categories', id);
  const updatable = buildArticleCategoryUpdatable({ ...cat, id });
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, { id, ...updatable, createdAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `article_categories/${id}`);
  }
}

export async function deleteArticleCategoryFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'art_cat');
  try {
    await deleteDoc(doc(db, 'article_categories', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `article_categories/${cleanId}`);
  }
}

export async function saveArticleToFirestore(art: Article): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(art.id, 'art');
  const ref = doc(db, 'articles', id);
  const updatable = buildArticleUpdatable({ ...art, id });
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, { id, ...updatable, createdAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `articles/${id}`);
  }
}

export async function deleteArticleFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'art');
  try {
    await deleteDoc(doc(db, 'articles', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `articles/${cleanId}`);
  }
}

export async function saveVideoToFirestore(vid: VideoItem): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(vid.id, 'vid');
  const ref = doc(db, 'videos', id);
  const updatable = buildVideoUpdatable({ ...vid, id });
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, { id, ...updatable, createdAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `videos/${id}`);
  }
}

export async function deleteVideoFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'vid');
  try {
    await deleteDoc(doc(db, 'videos', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `videos/${cleanId}`);
  }
}

export async function saveTestimonialToFirestore(item: Testimonial): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(item.id, 'test');
  const ref = doc(db, 'testimonials', id);
  const updatable = buildTestimonialUpdatable({ ...item, id });
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, {
        id,
        ...updatable,
        visitorId: clampString(item.visitorId || '', 128, ''),
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `testimonials/${id}`);
  }
}

export async function deleteTestimonialFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'test');
  try {
    await deleteDoc(doc(db, 'testimonials', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `testimonials/${cleanId}`);
  }
}

export async function saveMediaToFirestore(media: MediaItem, uploadedByUid?: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(media.id, 'med');
  const ref = doc(db, 'media', id);
  const uid = uploadedByUid || auth.currentUser?.uid || 'admin';
  const folder: MediaFolder = (['produits', 'articles', 'categories', 'site'] as const).includes(
    media.folder,
  )
    ? media.folder
    : 'site';

  const safeUrl = clampString(media.url || '', MAX_MEDIA_URL_LEN);
  if (!safeUrl) return;

  const updatable = {
    name: clampString(media.name || 'Média', 200, 'Média'),
    url: safeUrl,
    folder,
    sizeLabel: clampString(media.sizeLabel || '', 64, ''),
    updatedAt: serverTimestamp(),
  };

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, {
        id,
        ...updatable,
        uploadedByUid: clampString(uid, 128, 'admin'),
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `media/${id}`);
  }
}

export async function deleteMediaFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'med');
  try {
    await deleteDoc(doc(db, 'media', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `media/${cleanId}`);
  }
}

export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(customer.id, 'cust');
  const ref = doc(db, 'customers', id);
  const updatable = buildCustomerUpdatable({ ...customer, id });
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, { id, ...updatable, createdAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `customers/${id}`);
  }
}

export async function deleteCustomerFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'cust');
  try {
    await deleteDoc(doc(db, 'customers', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `customers/${cleanId}`);
  }
}

export async function upsertOrderAdminToFirestore(order: Order): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const { id, payload, safeHistory, validStatus } = buildOrderPayload(order);
  const orderNumber = sanitizeFirestoreId(String(payload.orderNumber), 'CMD');
  const orderRef = doc(db, 'orders', id);
  const trackingRef = doc(db, 'order_tracking', orderNumber);

  try {
    const [ordSnap, trackSnap] = await Promise.all([getDoc(orderRef), getDoc(trackingRef)]);
    if (ordSnap.exists()) {
      const updatePayload: Record<string, unknown> = {
        status: validStatus,
        adminNotes: payload.adminNotes,
        history: safeHistory,
        updatedAt: serverTimestamp(),
      };
      if (payload.invoice) {
        updatePayload.invoice = payload.invoice;
      }
      await updateDoc(orderRef, updatePayload);
      if (trackSnap.exists()) {
        await updateDoc(trackingRef, {
          status: validStatus,
          history: safeHistory,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      const contactHash = await computeOrderContactHash(
        String(payload.customerEmail || ''),
        String(payload.customerPhone || ''),
      );
      const batch = writeBatch(db);
      batch.set(orderRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (!trackSnap.exists()) {
        batch.set(trackingRef, {
          orderNumber,
          status: validStatus,
          customerFirstName: clampString(payload.customerFirstName, 100),
          customerLastName: clampString(payload.customerLastName, 100),
          contactHash,
          history: safeHistory,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${id}`);
  }
}

export async function saveSiteContentToFirestore(content: SiteContent): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const ref = doc(db, 'site_content', 'main');
  const updatable = buildSiteContentUpdatable(content);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, { ...updatable, createdAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'site_content/main');
  }
}

export async function saveSiteSettingsToFirestore(settings: SiteSettings): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const ref = doc(db, 'site_settings', 'public');
  const updatable = buildSiteSettingsUpdatable(settings);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, updatable);
    } else {
      await setDoc(ref, { ...updatable, createdAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'site_settings/public');
  }
}

export async function markMessageReadInFirestore(id: string, read: boolean): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'msg');
  try {
    const ref = doc(db, 'contact_messages', cleanId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { read: Boolean(read), updatedAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `contact_messages/${cleanId}`);
  }
}

export async function deleteMessageFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'msg');
  try {
    await deleteDoc(doc(db, 'contact_messages', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `contact_messages/${cleanId}`);
  }
}

export async function updateYoutubeSyncInFirestore(
  youtubeSync: NonNullable<SiteSettings['youtubeSync']>,
): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const ref = doc(db, 'site_settings', 'public');
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        youtubeSync: stripUndefinedDeep(youtubeSync),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'site_settings/public');
  }
}

export async function logActivityToFirestore(
  actorName: string,
  action: string,
  target: string,
  category: ActivityLog['category'],
): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(`act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`);
  try {
    await setDoc(doc(db, 'activities', id), {
      id,
      actorName: clampString(actorName || 'Administrateur', 120),
      action: clampString(action || 'Action', 200),
      target: clampString(target || '', 300),
      category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `activities/${id}`);
  }
}

// ---------------- STANDALONE FIRESTORE HELPERS (FIREBASE HOSTING MODE) ----------------

export async function getVisitorFromFirestore(uid?: string): Promise<VisitorMemberPublic | null> {
  const targetUid = sanitizeFirestoreId(uid || auth.currentUser?.uid || '', 'usr');
  if (!targetUid || !auth.currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'visitors', targetUid));
    if (!snap.exists()) return null;
    return mapVisitor(snap.data());
  } catch (err) {
    console.warn('Firestore visitor read fallback:', err);
    return null;
  }
}

export async function ensureAdminDocInFirestore(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<AdminUserPublic | null> {
  const cleanId = sanitizeFirestoreId(user.uid, 'adm');
  const cleanEmail = (user.email || '').trim().toLowerCase();
  if (!cleanId || !cleanEmail) return null;
  const ref = doc(db, 'admins', cleanId);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return mapAdminMember(snap.data());
    }
    if (!isBootstrapAdminEmail(cleanEmail)) {
      return null;
    }
    const adminName = clampString(
      user.displayName || cleanEmail.split('@')[0] || 'Administrateur Divin Horus',
      120,
    );
    await setDoc(ref, {
      id: cleanId,
      name: adminName,
      email: clampString(cleanEmail, 160),
      role: 'Super Administrateur',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: cleanId,
      name: adminName,
      email: cleanEmail,
      role: 'Super Administrateur',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Firestore admin check fallback:', err);
    if (isBootstrapAdminEmail(cleanEmail)) {
      return {
        id: cleanId,
        name: user.displayName || 'Administrateur Divin Horus',
        email: cleanEmail,
        role: 'Super Administrateur',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }
    return null;
  }
}

export async function getSiteSettingsFromFirestore(): Promise<SiteSettings | null> {
  try {
    const snap = await getDoc(doc(db, 'site_settings', 'public'));
    if (!snap.exists()) return null;
    const sData = snap.data();
    return {
      general: sData.general as SiteSettings['general'],
      contact: sData.contact as SiteSettings['contact'],
      socials: sData.socials as SiteSettings['socials'],
      ...(sData.youtubeSync ? { youtubeSync: sData.youtubeSync as SiteSettings['youtubeSync'] } : {}),
      orderSettings: sData.orderSettings as SiteSettings['orderSettings'],
    };
  } catch {
    return null;
  }
}

export async function getAllProductsFromFirestore(): Promise<Product[]> {
  if (!canUseFirestoreAdmin()) return [];
  try {
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs
      .map((d) => mapProduct(d.data()))
      .filter((p) => !DEMO_PRODUCT_IDS.has(p.id));
  } catch {
    return [];
  }
}

export async function getProductFromFirestore(id: string): Promise<Product | null> {
  const cleanId = sanitizeFirestoreId(id, 'prod');
  try {
    const snap = await getDoc(doc(db, 'products', cleanId));
    return snap.exists() ? mapProduct(snap.data()) : null;
  } catch {
    return null;
  }
}

export async function getAllCategoriesFromFirestore(): Promise<Category[]> {
  if (!canUseFirestoreAdmin()) return [];
  try {
    const snap = await getDocs(collection(db, 'categories'));
    return snap.docs
      .map((d) => mapCategory(d.data()))
      .filter((c) => !DEMO_CATEGORY_IDS.has(c.id))
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function getCategoryFromFirestore(id: string): Promise<Category | null> {
  const cleanId = sanitizeFirestoreId(id, 'cat');
  try {
    const snap = await getDoc(doc(db, 'categories', cleanId));
    return snap.exists() ? mapCategory(snap.data()) : null;
  } catch {
    return null;
  }
}

export async function getArticleFromFirestore(id: string): Promise<Article | null> {
  const cleanId = sanitizeFirestoreId(id, 'art');
  try {
    const snap = await getDoc(doc(db, 'articles', cleanId));
    return snap.exists() ? mapArticle(snap.data()) : null;
  } catch {
    return null;
  }
}

export async function getAllVideosFromFirestore(): Promise<VideoItem[]> {
  if (!canUseFirestoreAdmin()) return [];
  try {
    const snap = await getDocs(collection(db, 'videos'));
    return snap.docs
      .map((d) => mapVideo(d.data()))
      .filter((v) => !DEMO_VIDEO_IDS.has(v.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return [];
  }
}

export async function getVideoFromFirestore(id: string): Promise<VideoItem | null> {
  const cleanId = sanitizeFirestoreId(id, 'vid');
  try {
    const snap = await getDoc(doc(db, 'videos', cleanId));
    return snap.exists() ? mapVideo(snap.data()) : null;
  } catch {
    return null;
  }
}

export async function getCustomerFromFirestore(id: string): Promise<Customer | null> {
  const cleanId = sanitizeFirestoreId(id, 'cust');
  try {
    const snap = await getDoc(doc(db, 'customers', cleanId));
    return snap.exists() ? mapCustomer(snap.data()) : null;
  } catch {
    return null;
  }
}

export async function getOrderFromFirestore(id: string): Promise<Order | null> {
  const cleanId = sanitizeFirestoreId(id, 'ord');
  try {
    const snap = await getDoc(doc(db, 'orders', cleanId));
    return snap.exists() ? mapOrder(snap.data()) : null;
  } catch {
    return null;
  }
}

export async function getTestimonialFromFirestore(id: string): Promise<Testimonial | null> {
  const cleanId = sanitizeFirestoreId(id, 'test');
  try {
    const snap = await getDoc(doc(db, 'testimonials', cleanId));
    return snap.exists() ? mapTestimonial(snap.data()) : null;
  } catch {
    return null;
  }
}

export async function createAdminMemberInFirestore(admin: AdminUserPublic): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const id = sanitizeFirestoreId(admin.id, 'adm');
  try {
    await setDoc(doc(db, 'admins', id), {
      id,
      name: clampString(admin.name || 'Administrateur', 120),
      email: clampString(admin.email, 160),
      role: admin.role === 'Éditeur' ? 'Éditeur' : 'Super Administrateur',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `admins/${id}`);
  }
}

export async function deleteAdminMemberFromFirestore(id: string): Promise<void> {
  if (!canUseFirestoreAdmin()) return;
  const cleanId = sanitizeFirestoreId(id, 'adm');
  try {
    await deleteDoc(doc(db, 'admins', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `admins/${cleanId}`);
  }
}
