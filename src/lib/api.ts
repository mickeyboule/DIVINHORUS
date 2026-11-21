import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type UserCredential,
} from 'firebase/auth';
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
  OrderInvoice,
  OrderStatus,
  Product,
  PublicBootstrapData,
  PublicOrderTrackingInfo,
  SiteContent,
  SiteSettings,
  Testimonial,
  TestimonialStatus,
  VideoItem,
  VisitorMemberPublic,
} from '../types/cms';
import {
  createDefaultAdminBootstrap,
  createDefaultPublicBootstrap,
  createDefaultSiteSettings,
} from './defaultSeed';
import {
  auth,
  EmailNotVerifiedError,
  facebookProvider,
  getFirebaseErrorCode,
  googleProvider,
  isBootstrapAdminEmail,
  translateFirebaseAuthError,
} from './firebase';
import {
  canUseFirestoreAdmin,
  canUseFirestoreVisitor,
  createAdminMemberInFirestore,
  deleteAdminMemberFromFirestore,
  deleteArticleCategoryFromFirestore,
  deleteArticleFromFirestore,
  deleteCategoryFromFirestore,
  deleteCustomerFromFirestore,
  deleteMediaFromFirestore,
  deleteMessageFromFirestore,
  deleteProductFromFirestore,
  deleteTestimonialFromFirestore,
  deleteVideoFromFirestore,
  ensureAdminDocInFirestore,
  getAllCategoriesFromFirestore,
  getAllProductsFromFirestore,
  getAllVideosFromFirestore,
  getArticleFromFirestore,
  getCategoryFromFirestore,
  getCustomerFromFirestore,
  getOrderFromFirestore,
  getOrdersForVisitorFromFirestore,
  getProductFromFirestore,
  getSiteSettingsFromFirestore,
  getTestimonialFromFirestore,
  getVideoFromFirestore,
  getVisitorFromFirestore,
  loadAdminFromFirestore,
  loadPublicFromFirestore,
  markMessageReadInFirestore,
  saveArticleCategoryToFirestore,
  saveArticleToFirestore,
  saveCategoryToFirestore,
  saveContactMessageToFirestore,
  saveCustomerToFirestore,
  saveMediaToFirestore,
  saveOrderToFirestore,
  saveProductToFirestore,
  saveSiteContentToFirestore,
  saveSiteSettingsToFirestore,
  saveTestimonialFromVisitorToFirestore,
  saveTestimonialToFirestore,
  saveVideoToFirestore,
  syncVisitorToFirestore,
  trackOrderFromFirestore,
  updateYoutubeSyncInFirestore,
  upsertOrderAdminToFirestore,
} from './firestoreStore';

const TOKEN_KEY = 'ev_admin_token';
const VISITOR_TOKEN_KEY = 'ev_visitor_token';
const CLIENT_KEY_STORAGE = 'ev_client_key';

let memoryToken: string | null = null;
let memoryVisitorToken: string | null = null;
let memoryClientKey: string | null = null;

class ApiUnavailableError extends Error {
  constructor(message = 'API serveur indisponible') {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

function makeClientId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}_${rand}`;
}

function clientSlugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractYoutubeIdClient(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const embedMatch = trimmed.match(/youtube\.com\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return '';
}

function decodeXmlEntitiesClient(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

function stripHtmlTagsClient(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface ParsedYoutubeFeedEntry {
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  youtubeUrl: string;
  publishedAt: string;
}

function parseYoutubeAtomFeedXml(xml: string): {
  channelId: string;
  entries: ParsedYoutubeFeedEntry[];
} {
  const channelIdMatch = xml.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);
  const rawChannelId = channelIdMatch ? channelIdMatch[1].trim() : '';
  const channelId = rawChannelId
    ? rawChannelId.startsWith('UC')
      ? rawChannelId
      : `UC${rawChannelId}`
    : '';

  const entries: ParsedYoutubeFeedEntry[] = [];
  const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
  for (const m of entryMatches) {
    const block = m[1];
    const videoIdMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (!videoIdMatch) continue;
    const youtubeId = videoIdMatch[1].trim();
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = block.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const thumbMatch = block.match(/<media:thumbnail[^>]*url="([^"]+)"/);
    const pubMatch = block.match(/<published>([^<]+)<\/published>/);

    const rawDesc = descMatch ? decodeXmlEntitiesClient(descMatch[1]) : '';
    const shortDesc = rawDesc.length > 220 ? `${rawDesc.slice(0, 217).trim()}...` : rawDesc;

    entries.push({
      youtubeId,
      title: titleMatch ? decodeXmlEntitiesClient(titleMatch[1]) : `Vidéo (${youtubeId})`,
      description: shortDesc,
      thumbnail: thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      publishedAt: pubMatch ? pubMatch[1].trim() : new Date().toISOString(),
    });
  }

  return { channelId, entries };
}

async function fetchTextWithTimeout(url: string, timeoutMs = 7000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYoutubeFeedEntriesClient(feedUrl: string): Promise<{
  channelId: string;
  entries: ParsedYoutubeFeedEntry[];
} | null> {
  // 1) AllOrigins raw XML feed (preserves <yt:channelId>, <media:description>, etc.)
  const xml = await fetchTextWithTimeout(
    `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
    7500,
  );
  if (xml && xml.includes('<feed') && xml.includes('<yt:videoId>')) {
    const parsed = parseYoutubeAtomFeedXml(xml);
    if (parsed.entries.length > 0 || parsed.channelId) {
      return parsed;
    }
  }

  // 2) Fallback rss2json CORS JSON bridge
  const rawJson = await fetchTextWithTimeout(
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`,
    7500,
  );
  if (rawJson) {
    try {
      const data = JSON.parse(rawJson) as {
        status?: string;
        feed?: { link?: string };
        items?: Array<{
          title?: string;
          pubDate?: string;
          link?: string;
          guid?: string;
          thumbnail?: string;
          description?: string;
        }>;
      };
      if (data.status === 'ok' && Array.isArray(data.items)) {
        const feedChannelMatch = (data.feed?.link || '').match(/\/channel\/(UC[a-zA-Z0-9_-]{20,})/);
        const entries: ParsedYoutubeFeedEntry[] = [];
        for (const item of data.items) {
          const guidId = (item.guid || '').replace(/^yt:video:/, '').trim();
          const youtubeId =
            (/^[a-zA-Z0-9_-]{11}$/.test(guidId) ? guidId : '') ||
            extractYoutubeIdClient(item.link || '');
          if (!youtubeId) continue;
          const cleanDesc = stripHtmlTagsClient(item.description || '');
          const shortDesc = cleanDesc.length > 220 ? `${cleanDesc.slice(0, 217).trim()}...` : cleanDesc;
          const parsedDate = item.pubDate
            ? new Date(item.pubDate.replace(' ', 'T') + (item.pubDate.includes('Z') ? '' : 'Z'))
            : new Date();
          entries.push({
            youtubeId,
            title: (item.title || '').trim() || `Vidéo (${youtubeId})`,
            description: shortDesc,
            thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
            youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
            publishedAt: Number.isNaN(parsedDate.getTime())
              ? new Date().toISOString()
              : parsedDate.toISOString(),
          });
        }
        return {
          channelId: feedChannelMatch ? feedChannelMatch[1] : '',
          entries,
        };
      }
    } catch {
      // Ignore malformed JSON
    }
  }

  return null;
}

async function syncYoutubeChannelClientDirect(
  rawInput: string,
  autoSync: boolean,
): Promise<{
  addedCount: number;
  added: VideoItem[];
  videos: VideoItem[];
  youtubeSync: NonNullable<SiteSettings['youtubeSync']>;
}> {
  const settings = (await getSiteSettingsFromFirestore()) || createDefaultSiteSettings();
  const savedSync = settings.youtubeSync;
  let trimmed = (rawInput || savedSync?.channelUrl || '').trim();
  if (!trimmed) {
    throw new Error('Veuillez saisir le lien ou l’identifiant de votre chaîne YouTube.');
  }

  let resolvedChannelId = '';
  let resolvedChannelUrl = trimmed;
  let preloadedEntries: ParsedYoutubeFeedEntry[] | null = null;

  // Direct UC... channel ID
  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    resolvedChannelId = trimmed;
    resolvedChannelUrl = `https://www.youtube.com/channel/${trimmed}`;
  } else {
    if (trimmed.startsWith('@')) {
      trimmed = `https://www.youtube.com/${trimmed}`;
    } else if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    resolvedChannelUrl = trimmed;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmed);
    } catch {
      throw new Error('Lien de chaîne YouTube invalide.');
    }

    if (!parsedUrl.hostname.includes('youtube.com') && !parsedUrl.hostname.includes('youtu.be')) {
      throw new Error('Veuillez indiquer une adresse youtube.com valide.');
    }

    const directChannelMatch =
      parsedUrl.pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]{20,})/) ||
      (parsedUrl.searchParams.get('channel_id') || '').match(/^(UC[a-zA-Z0-9_-]{20,})$/);

    if (directChannelMatch) {
      resolvedChannelId = directChannelMatch[1];
    } else {
      const playlistId = parsedUrl.searchParams.get('list');
      if (playlistId && /^[a-zA-Z0-9_-]{10,}$/.test(playlistId)) {
        const playlistFeed = await fetchYoutubeFeedEntriesClient(
          `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`,
        );
        if (playlistFeed) {
          preloadedEntries = playlistFeed.entries;
          resolvedChannelId = playlistFeed.channelId || playlistId;
        }
      }

      if (!resolvedChannelId && savedSync?.channelId && /^UC[a-zA-Z0-9_-]{20,}$/.test(savedSync.channelId)) {
        const normSaved = (savedSync.channelUrl || '').replace(/\/+$/, '').toLowerCase();
        const normCurrent = trimmed.replace(/\/+$/, '').toLowerCase();
        if (normSaved === normCurrent) {
          resolvedChannelId = savedSync.channelId;
        }
      }

      // Attempt client-side HTML resolution via CORS bridge
      if (!resolvedChannelId) {
        const html = await fetchTextWithTimeout(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmed)}`,
          7000,
        );
        if (html) {
          const patterns = [
            /"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{20,})"/,
            /"externalId"\s*:\s*"(UC[a-zA-Z0-9_-]{20,})"/,
            /itemprop="identifier"\s+content="(UC[a-zA-Z0-9_-]{20,})"/,
            /https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{20,})/,
          ];
          for (const pat of patterns) {
            const m = html.match(pat);
            if (m && m[1]) {
              resolvedChannelId = m[1];
              break;
            }
          }
        }
      }

      // Try legacy /user/ or @handle Atom feed (?user=...)
      if (!resolvedChannelId) {
        const userOrHandleMatch =
          parsedUrl.pathname.match(/\/user\/([^/?#]+)/) ||
          parsedUrl.pathname.match(/\/@([^/?#]+)/) ||
          parsedUrl.pathname.match(/\/c\/([^/?#]+)/);
        if (userOrHandleMatch?.[1]) {
          const userFeed = await fetchYoutubeFeedEntriesClient(
            `https://www.youtube.com/feeds/videos.xml?user=${encodeURIComponent(userOrHandleMatch[1])}`,
          );
          if (userFeed && (userFeed.entries.length > 0 || userFeed.channelId)) {
            preloadedEntries = userFeed.entries;
            resolvedChannelId = userFeed.channelId || userOrHandleMatch[1];
          }
        }
      }
    }
  }

  if (!resolvedChannelId && !preloadedEntries) {
    throw new Error(
      'Sur Firebase Hosting, YouTube bloque la lecture automatique des liens @handle. Collez votre identifiant de chaîne (commençant par UC...) ou le lien /channel/UC... (sur YouTube : À propos → Partager la chaîne → Copier l’identifiant de la chaîne).',
    );
  }

  if (!preloadedEntries) {
    const feedRes = await fetchYoutubeFeedEntriesClient(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(resolvedChannelId)}`,
    );
    if (!feedRes) {
      throw new Error(
        'Impossible de récupérer le flux RSS de cette chaîne YouTube. Vérifiez l’identifiant UC... et réessayez.',
      );
    }
    preloadedEntries = feedRes.entries;
    if (feedRes.channelId && feedRes.channelId.startsWith('UC')) {
      resolvedChannelId = feedRes.channelId;
    }
  }

  const existingVideos = await getAllVideosFromFirestore();
  const existingIds = new Set(existingVideos.map((v) => v.youtubeId));
  const newEntries = preloadedEntries.filter((e) => e.youtubeId && !existingIds.has(e.youtubeId));

  const now = new Date().toISOString();
  const added: VideoItem[] = newEntries.map((entry, index) => ({
    id: makeClientId('vid'),
    title: entry.title.trim() || `Vidéo (${entry.youtubeId})`,
    youtubeUrl: entry.youtubeUrl || `https://www.youtube.com/watch?v=${entry.youtubeId}`,
    youtubeId: entry.youtubeId,
    thumbnail: entry.thumbnail || `https://i.ytimg.com/vi/${entry.youtubeId}/hqdefault.jpg`,
    description: entry.description.trim(),
    duration: '',
    visible: true,
    featured: false,
    sortOrder: index + 1,
    createdAt: entry.publishedAt || now,
  }));

  let updatedVideos: VideoItem[];
  if (added.length > 0) {
    const shiftedExisting = existingVideos.map((v) => ({
      ...v,
      sortOrder: (v.sortOrder || 0) + added.length,
    }));
    await Promise.all([
      ...added.map((v) => saveVideoToFirestore(v)),
      ...shiftedExisting.map((v) => saveVideoToFirestore(v)),
    ]);
    updatedVideos = [...added, ...shiftedExisting].sort((a, b) => a.sortOrder - b.sortOrder);
  } else {
    updatedVideos = [...existingVideos].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const nextSync: NonNullable<SiteSettings['youtubeSync']> = {
    channelUrl: resolvedChannelUrl,
    channelId: resolvedChannelId,
    autoSync,
    lastSyncAt: now,
  };
  await updateYoutubeSyncInFirestore(nextSync);

  return {
    addedCount: added.length,
    added,
    videos: updatedVideos,
    youtubeSync: nextSync,
  };
}

async function withServerFallback<T>(
  serverCall: () => Promise<T>,
  firebaseFallback: () => Promise<T>,
): Promise<T> {
  try {
    return await serverCall();
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return await firebaseFallback();
    }
    throw err;
  }
}

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

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiUnavailableError('Serveur API inaccessible.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new ApiUnavailableError('Mode hébergement statique Firebase détecté.');
  }

  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!data || typeof data !== 'object') {
    throw new ApiUnavailableError('Réponse API non JSON.');
  }

  if (!res.ok) {
    if ((res.status === 502 || res.status === 503 || res.status === 504) && !data.error) {
      throw new ApiUnavailableError(`Serveur indisponible (${res.status}).`);
    }
    throw new Error(data.error || `Erreur serveur (${res.status})`);
  }
  return data as T;
}

export const publicApi = {
  getBootstrap: async (): Promise<PublicBootstrapData> => {
    const [fsRes, serverRes] = await Promise.allSettled([
      loadPublicFromFirestore(),
      request<PublicBootstrapData>('/api/public/bootstrap'),
    ]);
    const fsData = fsRes.status === 'fulfilled' ? fsRes.value : null;
    const serverData = serverRes.status === 'fulfilled' ? serverRes.value : null;
    if (fsData) {
      return {
        ...fsData,
        ...(serverData?.geo ? { geo: serverData.geo } : {}),
      };
    }
    if (serverData) return serverData;
    return createDefaultPublicBootstrap();
  },
  createOrder: async (payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    deliveryAddress: string;
    message: string;
    items: Array<{ productId: string; quantity: number }>;
    customerCountry?: string;
    displayCurrencyCode?: string;
    displayCurrencySymbol?: string;
    displayTotal?: number;
  }) => {
    return withServerFallback(
      async () => {
        const res = await request<{ order: Order; visitor?: VisitorMemberPublic }>(
          '/api/public/orders',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          },
        );
        if (canUseFirestoreVisitor() || canUseFirestoreAdmin()) {
          await saveOrderToFirestore(res.order);
          if (res.visitor && canUseFirestoreVisitor()) {
            void syncVisitorToFirestore(res.visitor);
          }
        }
        return res;
      },
      async () => {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user || (!canUseFirestoreVisitor() && !canUseFirestoreAdmin())) {
          throw new Error('Veuillez vous connecter pour valider votre commande.');
        }

        const publicData = (await loadPublicFromFirestore()) || createDefaultPublicBootstrap();
        const now = new Date().toISOString();
        const orderItems = payload.items.map((reqItem) => {
          const prod = publicData.products.find((p) => p.id === reqItem.productId);
          if (!prod) {
            throw new Error('Produit introuvable ou indisponible.');
          }
          const qty = Math.max(1, Math.min(99, Math.floor(reqItem.quantity || 1)));
          return {
            productId: prod.id,
            productName: prod.name,
            productRef: prod.reference,
            unitPrice: prod.price,
            quantity: qty,
            image: prod.images[0] || '',
          };
        });

        if (orderItems.length === 0) {
          throw new Error('Veuillez sélectionner au moins un produit.');
        }

        const subtotal = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        const countryCode = (payload.customerCountry || 'FR').toUpperCase().trim();
        const matchedRule = (
          publicData.settings.orderSettings.shippingRatesByCountry || []
        ).find((r) => r.countryCode.toUpperCase().trim() === countryCode);
        const rawFee = matchedRule
          ? matchedRule.fee
          : (publicData.settings.orderSettings.defaultShippingFee ?? 0);
        const shippingFee = Math.max(0, Math.round(rawFee * 100) / 100);
        const indicativeTotal = Math.round((subtotal + shippingFee) * 100) / 100;

        const orderId = makeClientId('ord');
        const orderNumber = `CMD-${Date.now().toString().slice(-5)}`;
        const order: Order = {
          id: orderId,
          orderNumber,
          createdAt: now,
          updatedAt: now,
          status: 'Nouvelle',
          customerId: `cust_${user.uid.slice(0, 12)}`,
          visitorId: user.uid,
          customerFirstName: payload.firstName.trim(),
          customerLastName: payload.lastName.trim(),
          customerPhone: payload.phone.trim(),
          customerEmail: payload.email.trim() || user.email || '',
          customerCountry: countryCode,
          deliveryAddress: payload.deliveryAddress.trim(),
          message: payload.message.trim(),
          items: orderItems,
          subtotal,
          shippingFee,
          indicativeTotal,
          ...(payload.displayCurrencyCode
            ? { displayCurrencyCode: payload.displayCurrencyCode }
            : {}),
          ...(payload.displayCurrencySymbol
            ? { displayCurrencySymbol: payload.displayCurrencySymbol }
            : {}),
          ...(typeof payload.displayTotal === 'number'
            ? { displayTotal: payload.displayTotal }
            : {}),
          adminNotes: '',
          history: [
            {
              status: 'Nouvelle',
              date: now,
              note: 'Demande de commande enregistrée depuis la boutique.',
              actor: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim() || 'Client',
            },
          ],
        };

        await saveOrderToFirestore(order);

        const visitor: VisitorMemberPublic = {
          id: user.uid,
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email: payload.email.trim() || user.email || '',
          phone: payload.phone.trim(),
          address: payload.deliveryAddress.trim(),
          country: countryCode,
          createdAt: now,
        };
        if (canUseFirestoreVisitor()) {
          void syncVisitorToFirestore(visitor);
        }
        return { order, visitor };
      },
    );
  },
  sendContact: async (payload: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) => {
    return withServerFallback(
      async () => {
        const res = await request<{ message: ContactMessage }>('/api/public/contact', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreVisitor() || canUseFirestoreAdmin()) {
          await saveContactMessageToFirestore(res.message);
        }
        return res;
      },
      async () => {
        await auth.authStateReady();
        if (!canUseFirestoreVisitor() && !canUseFirestoreAdmin()) {
          throw new Error(
            'Veuillez vous connecter (Mon compte) pour envoyer un message directement depuis le site.',
          );
        }
        const msg: ContactMessage = {
          id: makeClientId('msg'),
          name: payload.name.trim(),
          email: payload.email.trim(),
          phone: payload.phone.trim(),
          subject: payload.subject.trim(),
          message: payload.message.trim(),
          read: false,
          createdAt: new Date().toISOString(),
        };
        await saveContactMessageToFirestore(msg);
        return { message: msg };
      },
    );
  },
  trackOrder: async (orderNumber: string, contact: string) => {
    const fsOrder = await trackOrderFromFirestore(orderNumber, contact).catch(() => null);
    if (fsOrder) {
      return { order: fsOrder };
    }
    return withServerFallback(
      () =>
        request<{ order: PublicOrderTrackingInfo }>('/api/public/orders/track', {
          method: 'POST',
          body: JSON.stringify({ orderNumber, contact }),
        }),
      async () => {
        throw new Error('Aucune commande trouvée avec ce numéro et ce contact.');
      },
    );
  },
  toggleArticleLike: async (articleId: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ article: Article; liked: boolean }>(
          `/api/public/articles/${articleId}/like`,
          {
            method: 'POST',
            body: JSON.stringify({ clientKey: getOrCreateClientKey() }),
          },
        );
        if (canUseFirestoreAdmin()) {
          void saveArticleToFirestore(res.article);
        }
        return res;
      },
      async () => {
        const art = await getArticleFromFirestore(articleId);
        if (!art) {
          throw new Error('Article introuvable.');
        }
        const ck = getOrCreateClientKey();
        const likedByKeys = Array.isArray(art.likedByKeys) ? [...art.likedByKeys] : [];
        const exists = likedByKeys.includes(ck);
        const nextLiked = !exists;
        const updated: Article = {
          ...art,
          likedByKeys: exists ? likedByKeys.filter((k) => k !== ck) : [...likedByKeys, ck],
          likesCount: Math.max(0, (art.likesCount || 0) + (exists ? -1 : 1)),
        };
        if (canUseFirestoreAdmin()) {
          void saveArticleToFirestore(updated);
        }
        return { article: updated, liked: nextLiked };
      },
    );
  },
  createTestimonial: async (payload: {
    authorName: string;
    authorLocation: string;
    rating: number;
    content: string;
  }) => {
    return withServerFallback(
      async () => {
        const res = await request<{ testimonial: Testimonial }>('/api/public/testimonials', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreVisitor() || canUseFirestoreAdmin()) {
          await saveTestimonialFromVisitorToFirestore(res.testimonial);
        }
        return res;
      },
      async () => {
        await auth.authStateReady();
        if (!canUseFirestoreVisitor() && !canUseFirestoreAdmin()) {
          throw new Error('Veuillez vous connecter pour publier un témoignage.');
        }
        const testimonial: Testimonial = {
          id: makeClientId('test'),
          authorName: payload.authorName.trim(),
          authorLocation: payload.authorLocation.trim(),
          rating: Math.min(5, Math.max(1, Math.round(payload.rating || 5))),
          content: payload.content.trim(),
          status: 'En attente',
          featured: false,
          visitorId: auth.currentUser?.uid,
          createdAt: new Date().toISOString(),
        };
        await saveTestimonialFromVisitorToFirestore(testimonial);
        return { testimonial };
      },
    );
  },
};

type PendingSignupProfile = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  country?: string;
};

const PENDING_PROFILE_PREFIX = 'dh_pending_profile_v1:';
const memoryPendingProfiles = new Map<string, PendingSignupProfile>();

function savePendingSignupProfile(email: string, profile: PendingSignupProfile): void {
  const key = email.trim().toLowerCase();
  if (!key) return;
  memoryPendingProfiles.set(key, profile);
  try {
    localStorage.setItem(`${PENDING_PROFILE_PREFIX}${key}`, JSON.stringify(profile));
  } catch {
    // Ignore storage errors in restricted iframes
  }
}

function getPendingSignupProfile(email?: string | null): PendingSignupProfile | undefined {
  const key = (email || '').trim().toLowerCase();
  if (!key) return undefined;
  const inMemory = memoryPendingProfiles.get(key);
  if (inMemory) return inMemory;
  try {
    const raw = localStorage.getItem(`${PENDING_PROFILE_PREFIX}${key}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PendingSignupProfile;
    memoryPendingProfiles.set(key, parsed);
    return parsed;
  } catch {
    return undefined;
  }
}

function clearPendingSignupProfile(email?: string | null): void {
  const key = (email || '').trim().toLowerCase();
  if (!key) return;
  memoryPendingProfiles.delete(key);
  try {
    localStorage.removeItem(`${PENDING_PROFILE_PREFIX}${key}`);
  } catch {
    // Ignore storage errors
  }
}

type FirebaseSessionResponse =
  | { role: 'admin'; admin: AdminUserPublic; token: string }
  | { role: 'visitor'; visitor: VisitorMemberPublic; orders: Order[]; token: string };

async function resolveFirebaseSessionDirect(
  idToken: string,
  mode: 'unified' | 'admin' | 'visitor',
  profile?: PendingSignupProfile,
): Promise<FirebaseSessionResponse> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Session Firebase introuvable.');
  }

  const email = (user.email || '').trim().toLowerCase();
  const isBootstrapAdmin = isBootstrapAdminEmail(email);

  if (mode === 'admin' || (mode === 'unified' && isBootstrapAdmin)) {
    const adminDoc = await ensureAdminDocInFirestore({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });
    if (adminDoc) {
      return { role: 'admin', admin: adminDoc, token: idToken };
    }
    if (mode === 'admin') {
      throw new Error('Ce compte n’est pas autorisé à accéder à l’administration.');
    }
  }

  const existingVisitor = await getVisitorFromFirestore(user.uid);
  const nameParts = (user.displayName || '').trim().split(/\s+/).filter(Boolean);
  const visitor: VisitorMemberPublic = {
    id: user.uid,
    firstName:
      profile?.firstName?.trim() ||
      existingVisitor?.firstName ||
      nameParts[0] ||
      'Membre',
    lastName:
      profile?.lastName?.trim() ||
      existingVisitor?.lastName ||
      nameParts.slice(1).join(' ') ||
      'Divin Horus',
    email: existingVisitor?.email || user.email || '',
    phone: profile?.phone?.trim() || existingVisitor?.phone || '',
    address: profile?.address?.trim() || existingVisitor?.address || '',
    country: profile?.country?.trim().toUpperCase() || existingVisitor?.country || '',
    createdAt: existingVisitor?.createdAt || new Date().toISOString(),
  };

  if (canUseFirestoreVisitor()) {
    await syncVisitorToFirestore(visitor);
  }
  const orders = (await getOrdersForVisitorFromFirestore()) || [];
  return { role: 'visitor', visitor, orders, token: idToken };
}

async function exchangeFirebaseSession(
  idToken: string,
  mode: 'unified' | 'admin' | 'visitor',
  profile?: PendingSignupProfile,
): Promise<FirebaseSessionResponse> {
  return withServerFallback(
    () =>
      request<FirebaseSessionResponse>('/api/auth/firebase-session', {
        method: 'POST',
        body: JSON.stringify({ idToken, mode, ...(profile ? { profile } : {}) }),
      }),
    () => resolveFirebaseSessionDirect(idToken, mode, profile),
  );
}

function isCredentialFallbackCode(code: string): boolean {
  return (
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential'
  );
}

async function ensureFirebaseEmailVerified(
  cred: UserCredential,
  fallbackEmail: string,
): Promise<string> {
  await cred.user.reload().catch(() => {});
  const isVerified = auth.currentUser?.emailVerified ?? cred.user.emailVerified;
  if (!isVerified) {
    await sendEmailVerification(cred.user).catch(() => {});
    await signOut(auth).catch(() => {});
    setStoredVisitorToken(null);
    setStoredAdminToken(null);
    throw new EmailNotVerifiedError(cred.user.email || fallbackEmail);
  }
  return cred.user.getIdToken(true);
}

export const visitorApi = {
  register: async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    country: string;
    password: string;
  }): Promise<{ requiresVerification: true; email: string }> => {
    const cleanEmail = payload.email.trim();
    const cleanPassword = payload.password.trim();
    const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      if (fullName) {
        await updateProfile(cred.user, { displayName: fullName }).catch(() => {});
      }
      await sendEmailVerification(cred.user);
      const targetEmail = cred.user.email || cleanEmail;
      const signupProfile: PendingSignupProfile = {
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        country: payload.country.trim().toUpperCase(),
      };
      savePendingSignupProfile(cleanEmail, signupProfile);
      savePendingSignupProfile(targetEmail, signupProfile);
      await signOut(auth).catch(() => {});
      setStoredVisitorToken(null);
      return { requiresVerification: true, email: targetEmail };
    } catch (err) {
      await signOut(auth).catch(() => {});
      throw new Error(translateFirebaseAuthError(err));
    }
  },
  registerAndSignIn: async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    country: string;
    password: string;
  }): Promise<{ visitor: VisitorMemberPublic; orders: Order[]; token: string }> => {
    const cleanEmail = payload.email.trim();
    const cleanPassword = payload.password.trim();
    const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();

    let createdFirebaseUser: UserCredential['user'] | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      createdFirebaseUser = cred.user;
      if (fullName) {
        await updateProfile(cred.user, { displayName: fullName }).catch(() => {});
      }
      void sendEmailVerification(cred.user).catch(() => {});
      const idToken = await cred.user.getIdToken(true);

      const signupProfile: PendingSignupProfile = {
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        country: payload.country.trim().toUpperCase(),
      };
      savePendingSignupProfile(cleanEmail, signupProfile);
      if (cred.user.email) {
        savePendingSignupProfile(cred.user.email, signupProfile);
      }

      try {
        const res = await request<{ visitor: VisitorMemberPublic; orders: Order[]; token: string }>(
          '/api/visitor/register',
          {
            method: 'POST',
            body: JSON.stringify({
              firstName: payload.firstName.trim(),
              lastName: payload.lastName.trim(),
              email: cred.user.email || cleanEmail,
              phone: payload.phone.trim(),
              address: payload.address.trim(),
              country: payload.country.trim().toUpperCase(),
              password: cleanPassword,
              firebaseIdToken: idToken,
            }),
          },
        );
        setStoredVisitorToken(res.token);
        return res;
      } catch (serverErr) {
        if (serverErr instanceof ApiUnavailableError) {
          // On pure static Firebase Hosting, Firestore rules require verified email for writes
          await signOut(auth).catch(() => {});
          setStoredVisitorToken(null);
          throw new EmailNotVerifiedError(cred.user.email || cleanEmail);
        }
        throw serverErr;
      }
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        throw err;
      }
      if (createdFirebaseUser) {
        await createdFirebaseUser.delete().catch(() => {});
        await signOut(auth).catch(() => {});
      }
      const code = getFirebaseErrorCode(err);
      if (code) {
        throw new Error(translateFirebaseAuthError(err));
      }
      throw err instanceof Error ? err : new Error('Impossible de créer le compte.');
    }
  },
  login: async (email: string, password: string) => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const idToken = await ensureFirebaseEmailVerified(cred, cleanEmail);
      const pendingProfile = getPendingSignupProfile(cred.user.email || cleanEmail);
      const res = await exchangeFirebaseSession(idToken, 'visitor', pendingProfile);
      if (res.role === 'visitor') {
        clearPendingSignupProfile(cred.user.email || cleanEmail);
        setStoredVisitorToken(res.token);
        void syncVisitorToFirestore(res.visitor);
        return { visitor: res.visitor, orders: res.orders, token: res.token };
      }
      throw new Error('Compte visiteur requis.');
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        throw err;
      }
      const code = getFirebaseErrorCode(err);
      if (isCredentialFallbackCode(code)) {
        try {
          const res = await request<{ visitor: VisitorMemberPublic; orders: Order[]; token: string }>(
            '/api/visitor/login',
            { method: 'POST', body: JSON.stringify({ email: cleanEmail, password: cleanPassword }) },
          );
          setStoredVisitorToken(res.token);
          return res;
        } catch (fallbackErr) {
          if (fallbackErr instanceof ApiUnavailableError) {
            throw new Error(translateFirebaseAuthError(err));
          }
          throw fallbackErr;
        }
      }
      if (code) {
        throw new Error(translateFirebaseAuthError(err));
      }
      throw err;
    }
  },
  unifiedLogin: async (
    email: string,
    password: string,
  ): Promise<
    | { role: 'admin'; admin: AdminUserPublic; token: string }
    | { role: 'visitor'; visitor: VisitorMemberPublic; orders: Order[]; token: string }
  > => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const idToken = await ensureFirebaseEmailVerified(cred, cleanEmail);
      const pendingProfile = getPendingSignupProfile(cred.user.email || cleanEmail);
      const res = await exchangeFirebaseSession(idToken, 'unified', pendingProfile);
      if (res.role === 'admin') {
        setStoredAdminToken(res.token);
      } else {
        clearPendingSignupProfile(cred.user.email || cleanEmail);
        setStoredVisitorToken(res.token);
        void syncVisitorToFirestore(res.visitor);
      }
      return res;
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        throw err;
      }
      const code = getFirebaseErrorCode(err);
      if (isCredentialFallbackCode(code)) {
        try {
          const res = await request<
            | { role: 'admin'; admin: AdminUserPublic; token: string }
            | { role: 'visitor'; visitor: VisitorMemberPublic; orders: Order[]; token: string }
          >('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
          });
          if (res.role === 'admin') {
            setStoredAdminToken(res.token);
          } else {
            setStoredVisitorToken(res.token);
          }
          return res;
        } catch (fallbackErr) {
          if (fallbackErr instanceof ApiUnavailableError) {
            throw new Error(translateFirebaseAuthError(err));
          }
          throw fallbackErr;
        }
      }
      if (code) {
        throw new Error(translateFirebaseAuthError(err));
      }
      throw err;
    }
  },
  logout: async () => {
    try {
      await signOut(auth).catch(() => {});
      await request<{ ok: boolean }>('/api/visitor/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setStoredVisitorToken(null);
    }
  },
  signInWithProvider: async (
    providerName: 'google' | 'facebook',
    mode: 'unified' | 'visitor' = 'unified',
  ): Promise<
    | { role: 'admin'; admin: AdminUserPublic; token: string }
    | { role: 'visitor'; visitor: VisitorMemberPublic; orders: Order[]; token: string }
  > => {
    const provider = providerName === 'google' ? googleProvider : facebookProvider;
    try {
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken(true);
      const res = await exchangeFirebaseSession(idToken, mode);
      if (res.role === 'admin') {
        setStoredAdminToken(res.token);
      } else {
        setStoredVisitorToken(res.token);
        void syncVisitorToFirestore(res.visitor);
      }
      return res;
    } catch (err) {
      const code = getFirebaseErrorCode(err);
      if (code) {
        throw new Error(translateFirebaseAuthError(err));
      }
      throw err;
    }
  },
  me: async () => {
    return withServerFallback(
      async () => {
        const res = await request<{ visitor: VisitorMemberPublic; orders: Order[] }>(
          '/api/visitor/me',
        );
        if (canUseFirestoreVisitor()) {
          void syncVisitorToFirestore(res.visitor);
          const fsOrders = await getOrdersForVisitorFromFirestore();
          if (fsOrders && fsOrders.length > 0) {
            const merged = new Map<string, Order>();
            for (const ord of res.orders) merged.set(ord.orderNumber, ord);
            for (const ord of fsOrders) merged.set(ord.orderNumber, ord);
            return {
              visitor: res.visitor,
              orders: Array.from(merged.values()).sort((a, b) =>
                b.createdAt.localeCompare(a.createdAt),
              ),
            };
          }
        }
        return res;
      },
      async () => {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user || !canUseFirestoreVisitor()) {
          throw new Error('Non connecté.');
        }
        const visitor = (await getVisitorFromFirestore(user.uid)) || {
          id: user.uid,
          firstName: (user.displayName || '').split(' ')[0] || 'Membre',
          lastName: (user.displayName || '').split(' ').slice(1).join(' ') || 'Divin Horus',
          email: user.email || '',
          phone: '',
          address: '',
          country: '',
          createdAt: new Date().toISOString(),
        };
        const orders = (await getOrdersForVisitorFromFirestore()) || [];
        return { visitor, orders };
      },
    );
  },
  updateProfile: async (payload: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    country?: string;
  }) => {
    return withServerFallback(
      async () => {
        const res = await request<{ visitor: VisitorMemberPublic; orders: Order[] }>(
          '/api/visitor/profile',
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          },
        );
        if (canUseFirestoreVisitor()) {
          await syncVisitorToFirestore(res.visitor);
        }
        return res;
      },
      async () => {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user || !canUseFirestoreVisitor()) {
          throw new Error('Connexion requise.');
        }
        const existing = await getVisitorFromFirestore(user.uid);
        const visitor: VisitorMemberPublic = {
          id: user.uid,
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email: existing?.email || user.email || '',
          phone: payload.phone.trim(),
          address: payload.address.trim(),
          country: (payload.country || existing?.country || '').toUpperCase().trim(),
          createdAt: existing?.createdAt || new Date().toISOString(),
        };
        await syncVisitorToFirestore(visitor);
        const orders = (await getOrdersForVisitorFromFirestore()) || [];
        return { visitor, orders };
      },
    );
  },
};

export const authApi = {
  login: async (email: string, password: string) => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const idToken = await ensureFirebaseEmailVerified(cred, cleanEmail);
      const res = await exchangeFirebaseSession(idToken, 'admin').catch(async (exchangeErr) => {
        await signOut(auth).catch(() => {});
        throw exchangeErr;
      });
      if (res.role !== 'admin') {
        await signOut(auth).catch(() => {});
        throw new Error('Ce compte n’est pas autorisé à accéder à l’administration.');
      }
      setStoredAdminToken(res.token);
      return res.admin;
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        throw err;
      }
      const code = getFirebaseErrorCode(err);
      if (isCredentialFallbackCode(code)) {
        try {
          const res = await request<{ admin: AdminUserPublic; token: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
          });
          setStoredAdminToken(res.token);
          return res.admin;
        } catch (fallbackErr) {
          if (fallbackErr instanceof ApiUnavailableError) {
            throw new Error(translateFirebaseAuthError(err));
          }
          throw fallbackErr;
        }
      }
      if (code) {
        throw new Error(translateFirebaseAuthError(err));
      }
      throw err;
    }
  },
  loginWithGoogle: async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken(true);
      const res = await exchangeFirebaseSession(idToken, 'admin').catch(async (exchangeErr) => {
        await signOut(auth).catch(() => {});
        throw exchangeErr;
      });
      if (res.role !== 'admin') {
        await signOut(auth).catch(() => {});
        throw new Error('Ce compte Google n’est pas autorisé à accéder à l’administration.');
      }
      setStoredAdminToken(res.token);
      return res.admin;
    } catch (err) {
      const code = getFirebaseErrorCode(err);
      if (code) {
        throw new Error(translateFirebaseAuthError(err));
      }
      throw err;
    }
  },
  logout: async () => {
    try {
      await signOut(auth).catch(() => {});
      await request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setStoredAdminToken(null);
    }
  },
  me: async () => {
    return withServerFallback(
      () => request<{ admin: AdminUserPublic }>('/api/auth/me'),
      async () => {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user || !canUseFirestoreAdmin()) {
          throw new Error('Non authentifié.');
        }
        const admin = await ensureAdminDocInFirestore({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
        if (!admin) throw new Error('Accès administrateur refusé.');
        return { admin };
      },
    );
  },
  syncFromFirebaseUser: async (mode: 'admin' | 'visitor') => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    await currentUser.reload().catch(() => {});
    const isSocialOAuth = currentUser.providerData.some(
      (p) => p.providerId === 'google.com' || p.providerId === 'facebook.com',
    );
    if (!isSocialOAuth && !currentUser.emailVerified) {
      await signOut(auth).catch(() => {});
      return null;
    }
    const idToken = await currentUser.getIdToken(true);
    const pendingProfile =
      mode === 'visitor' ? getPendingSignupProfile(currentUser.email) : undefined;
    const res = await exchangeFirebaseSession(idToken, mode, pendingProfile);
    if (res.role === 'admin') {
      setStoredAdminToken(res.token);
    } else {
      clearPendingSignupProfile(currentUser.email);
      setStoredVisitorToken(res.token);
      void syncVisitorToFirestore(res.visitor);
    }
    return res;
  },
};

export const adminApi = {
  getBootstrap: async (): Promise<AdminBootstrapData> => {
    const serverSeed = await request<AdminBootstrapData>('/api/admin/bootstrap').catch((err) => {
      if (err instanceof ApiUnavailableError) {
        return createDefaultAdminBootstrap(
          auth.currentUser
            ? {
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
                displayName: auth.currentUser.displayName,
              }
            : undefined,
        );
      }
      throw err;
    });

    if (canUseFirestoreAdmin()) {
      const fsData = await loadAdminFromFirestore(serverSeed);
      if (fsData) return fsData;
    }
    return serverSeed;
  },

  updateOrder: async (
    id: string,
    patch: { status?: OrderStatus; adminNotes?: string; statusNote?: string },
  ) => {
    return withServerFallback(
      async () => {
        const res = await request<{ order: Order }>(`/api/admin/orders/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        if (canUseFirestoreAdmin()) {
          await upsertOrderAdminToFirestore(res.order);
        }
        return res;
      },
      async () => {
        const existing = await getOrderFromFirestore(id);
        if (!existing) throw new Error('Commande introuvable.');
        const now = new Date().toISOString();
        const nextStatus = patch.status || existing.status;
        const history = [...existing.history];
        if (patch.status && patch.status !== existing.status) {
          history.push({
            status: nextStatus,
            date: now,
            note: patch.statusNote?.trim() || `Statut mis à jour vers ${nextStatus}`,
            actor: auth.currentUser?.displayName || 'Administrateur',
          });
        }
        const updated: Order = {
          ...existing,
          status: nextStatus,
          adminNotes: patch.adminNotes !== undefined ? patch.adminNotes : existing.adminNotes,
          history,
          updatedAt: now,
        };
        await upsertOrderAdminToFirestore(updated);
        return { order: updated };
      },
    );
  },

  saveOrderInvoice: async (
    id: string,
    payload: Partial<OrderInvoice> & { sendToClient?: boolean; saveAsDefault?: boolean },
  ) => {
    return withServerFallback(
      async () => {
        const res = await request<{ order: Order; settings?: SiteSettings }>(
          `/api/admin/orders/${id}/invoice`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          },
        );
        if (canUseFirestoreAdmin()) {
          await upsertOrderAdminToFirestore(res.order);
          if (res.settings) {
            await saveSiteSettingsToFirestore(res.settings);
          }
        }
        return res;
      },
      async () => {
        const existing = await getOrderFromFirestore(id);
        if (!existing) throw new Error('Commande introuvable.');
        const settings = (await getSiteSettingsFromFirestore()) || createDefaultSiteSettings();
        const now = new Date().toISOString();

        const rawItems =
          Array.isArray(payload.items) && payload.items.length > 0
            ? payload.items
            : existing.items.map((i, idx) => ({
                id: `${i.productId}_${idx}`,
                description: i.productName,
                reference: i.productRef,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              }));

        const items = rawItems.map((line, idx) => ({
          id: line.id || `line_${idx}_${Date.now()}`,
          description: String(line.description || 'Article').trim() || 'Article',
          reference: line.reference ? String(line.reference).trim() : '',
          quantity: Math.max(1, Math.round(Number(line.quantity) || 1)),
          unitPrice: Math.max(0, Number(line.unitPrice) || 0),
        }));

        const shippingFee = Math.max(
          0,
          Number(payload.shippingFee ?? existing.shippingFee ?? 0) || 0,
        );
        const discount = Math.max(0, Number(payload.discount ?? 0) || 0);
        const subtotal = Math.round(items.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 100) / 100;
        const total = Math.max(0, Math.round((subtotal + shippingFee - discount) * 100) / 100);
        const isSending = Boolean(payload.sendToClient);
        const prevInvoice = existing.invoice;
        const nextStatus: 'Brouillon' | 'Envoyée' = isSending
          ? 'Envoyée'
          : prevInvoice?.status === 'Envoyée'
            ? 'Envoyée'
            : 'Brouillon';

        const defaultSig = settings.orderSettings.defaultInvoiceSignature || {
          type: 'text' as const,
          imageUrl: '',
          signerName: auth.currentUser?.displayName || 'Direction DIVIN HORUS',
          signerRole: 'Direction · DIVIN HORUS',
        };
        const sigInput = payload.signature || prevInvoice?.signature || defaultSig;
        const invoice: OrderInvoice = {
          invoiceNumber:
            payload.invoiceNumber ||
            prevInvoice?.invoiceNumber ||
            `FAC-${existing.orderNumber.replace(/^CMD-/, '')}`,
          status: nextStatus,
          paymentStatus: payload.paymentStatus || prevInvoice?.paymentStatus || 'En attente de paiement',
          issuedAt: payload.issuedAt || prevInvoice?.issuedAt || now,
          dueDate:
            payload.dueDate ||
            prevInvoice?.dueDate ||
            new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 10),
          sentAt: isSending ? now : (prevInvoice?.sentAt ?? null),
          currencyCode:
            payload.currencyCode || prevInvoice?.currencyCode || settings.general.currencyCode || 'EUR',
          currencySymbol:
            payload.currencySymbol ||
            prevInvoice?.currencySymbol ||
            settings.general.currencySymbol ||
            '€',
          customerName:
            payload.customerName ||
            prevInvoice?.customerName ||
            `${existing.customerFirstName} ${existing.customerLastName}`.trim(),
          customerPhone: payload.customerPhone ?? prevInvoice?.customerPhone ?? existing.customerPhone,
          customerEmail: payload.customerEmail ?? prevInvoice?.customerEmail ?? existing.customerEmail,
          customerCountry:
            payload.customerCountry ?? prevInvoice?.customerCountry ?? existing.customerCountry ?? '',
          customerAddress:
            payload.customerAddress ?? prevInvoice?.customerAddress ?? existing.deliveryAddress,
          items,
          subtotal,
          shippingFee,
          discount,
          total,
          paymentMethod:
            payload.paymentMethod ??
            prevInvoice?.paymentMethod ??
            settings.orderSettings.defaultPaymentMethod ??
            'Mobile Money / Virement bancaire',
          paymentDetails:
            payload.paymentDetails ??
            prevInvoice?.paymentDetails ??
            settings.orderSettings.defaultPaymentDetails ??
            '',
          notes:
            payload.notes ?? prevInvoice?.notes ?? settings.orderSettings.defaultInvoiceNotes ?? '',
          signature: {
            type: sigInput.type || 'none',
            imageUrl: sigInput.imageUrl ? String(sigInput.imageUrl).trim() : '',
            signerName: String(sigInput.signerName ?? '').trim(),
            signerRole: String(sigInput.signerRole ?? '').trim(),
          },
          updatedAt: now,
        };

        const updatedOrder: Order = { ...existing, invoice, updatedAt: now };
        await upsertOrderAdminToFirestore(updatedOrder);

        let updatedSettings: SiteSettings | undefined;
        if (payload.saveAsDefault) {
          updatedSettings = {
            ...settings,
            orderSettings: {
              ...settings.orderSettings,
              defaultPaymentMethod: invoice.paymentMethod,
              defaultPaymentDetails: invoice.paymentDetails,
              defaultInvoiceNotes: invoice.notes,
              defaultInvoiceSignature: invoice.signature,
            },
          };
          await saveSiteSettingsToFirestore(updatedSettings);
        }

        return { order: updatedOrder, ...(updatedSettings ? { settings: updatedSettings } : {}) };
      },
    );
  },

  createCustomer: async (payload: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    country?: string;
    address?: string;
    notes?: string;
  }) => {
    return withServerFallback(
      async () => {
        const res = await request<{ customer: Customer }>('/api/admin/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveCustomerToFirestore(res.customer);
        }
        return res;
      },
      async () => {
        const now = new Date().toISOString();
        const customer: Customer = {
          id: makeClientId('cust'),
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          phone: (payload.phone || '').trim(),
          email: (payload.email || '').trim(),
          country: (payload.country || '').trim().toUpperCase(),
          address: (payload.address || '').trim(),
          notes: (payload.notes || '').trim(),
          createdAt: now,
          lastOrderAt: '',
          orderCount: 0,
          totalIndicative: 0,
        };
        await saveCustomerToFirestore(customer);
        return { customer };
      },
    );
  },

  updateCustomer: async (
    id: string,
    payload: Partial<
      Pick<Customer, 'firstName' | 'lastName' | 'phone' | 'email' | 'country' | 'address' | 'notes'>
    >,
  ) => {
    return withServerFallback(
      async () => {
        const res = await request<{ customer: Customer }>(`/api/admin/customers/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveCustomerToFirestore(res.customer);
        }
        return res;
      },
      async () => {
        const existing = await getCustomerFromFirestore(id);
        if (!existing) throw new Error('Client introuvable.');
        const updated: Customer = {
          ...existing,
          ...payload,
          ...(payload.country ? { country: payload.country.toUpperCase().trim() } : {}),
        };
        await saveCustomerToFirestore(updated);
        return { customer: updated };
      },
    );
  },

  updateCustomerNotes: async (id: string, notes: string) => {
    return adminApi.updateCustomer(id, { notes });
  },

  deleteCustomer: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>(`/api/admin/customers/${id}`, {
          method: 'DELETE',
        });
        if (canUseFirestoreAdmin()) {
          await deleteCustomerFromFirestore(id);
        }
        return res;
      },
      async () => {
        await deleteCustomerFromFirestore(id);
        return { ok: true };
      },
    );
  },

  createProduct: async (payload: Partial<Product>) => {
    return withServerFallback(
      async () => {
        const res = await request<{ product: Product }>('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveProductToFirestore(res.product);
        }
        return res;
      },
      async () => {
        const now = new Date().toISOString();
        const name = (payload.name || 'Nouveau produit').trim();
        const id = makeClientId('prod');
        const product: Product = {
          id,
          reference: (payload.reference || `DH-${Date.now().toString().slice(-4)}`).trim(),
          name,
          slug: clientSlugify(payload.slug || name) || id,
          price: Math.max(0, Number(payload.price) || 0),
          categoryId: payload.categoryId || 'cat_default',
          description: payload.description || '',
          additionalInfo: payload.additionalInfo || '',
          images: Array.isArray(payload.images) ? payload.images : [],
          availability: payload.availability || 'En stock',
          stockCount: Math.max(0, Number(payload.stockCount) || 0),
          featured: Boolean(payload.featured),
          active: payload.active !== false,
          orderCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        await saveProductToFirestore(product);
        return { product };
      },
    );
  },

  updateProduct: async (id: string, payload: Partial<Product>) => {
    return withServerFallback(
      async () => {
        const res = await request<{ product: Product }>(`/api/admin/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveProductToFirestore(res.product);
        }
        return res;
      },
      async () => {
        const existing = await getProductFromFirestore(id);
        if (!existing) throw new Error('Produit introuvable.');
        const updated: Product = {
          ...existing,
          ...payload,
          id: existing.id,
          updatedAt: new Date().toISOString(),
        };
        await saveProductToFirestore(updated);
        return { product: updated };
      },
    );
  },

  duplicateProduct: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ product: Product }>(`/api/admin/products/${id}/duplicate`, {
          method: 'POST',
        });
        if (canUseFirestoreAdmin()) {
          await saveProductToFirestore(res.product);
        }
        return res;
      },
      async () => {
        const existing = await getProductFromFirestore(id);
        if (!existing) throw new Error('Produit introuvable.');
        const now = new Date().toISOString();
        const newId = makeClientId('prod');
        const copy: Product = {
          ...existing,
          id: newId,
          name: `${existing.name} (Copie)`,
          slug: `${existing.slug}-copie-${Date.now().toString(36)}`,
          reference: `${existing.reference}-COPIE`,
          orderCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        await saveProductToFirestore(copy);
        return { product: copy };
      },
    );
  },

  deleteProduct: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>(`/api/admin/products/${id}`, {
          method: 'DELETE',
        });
        if (canUseFirestoreAdmin()) {
          await deleteProductFromFirestore(id);
        }
        return res;
      },
      async () => {
        await deleteProductFromFirestore(id);
        return { ok: true };
      },
    );
  },

  createCategory: async (payload: Partial<Category>) => {
    return withServerFallback(
      async () => {
        const res = await request<{ category: Category }>('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveCategoryToFirestore(res.category);
        }
        return res;
      },
      async () => {
        const now = new Date().toISOString();
        const name = (payload.name || 'Nouvelle catégorie').trim();
        const id = makeClientId('cat');
        const category: Category = {
          id,
          name,
          slug: clientSlugify(payload.slug || name) || id,
          description: payload.description || '',
          image: payload.image || '',
          order: Number(payload.order) || 1,
          visible: payload.visible !== false,
          createdAt: now,
        };
        await saveCategoryToFirestore(category);
        return { category };
      },
    );
  },

  updateCategory: async (id: string, payload: Partial<Category>) => {
    return withServerFallback(
      async () => {
        const res = await request<{ category: Category }>(`/api/admin/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveCategoryToFirestore(res.category);
        }
        return res;
      },
      async () => {
        const existing = await getCategoryFromFirestore(id);
        if (!existing) throw new Error('Catégorie introuvable.');
        const updated: Category = {
          ...existing,
          ...payload,
          id: existing.id,
        };
        await saveCategoryToFirestore(updated);
        return { category: updated };
      },
    );
  },

  reorderCategories: async (orderedIds: string[]) => {
    return withServerFallback(
      async () => {
        const res = await request<{ categories: Category[] }>('/api/admin/categories/reorder', {
          method: 'PUT',
          body: JSON.stringify({ orderedIds }),
        });
        if (canUseFirestoreAdmin()) {
          await Promise.all(res.categories.map((cat) => saveCategoryToFirestore(cat)));
        }
        return res;
      },
      async () => {
        const all = await getAllCategoriesFromFirestore();
        const map = new Map(all.map((c) => [c.id, c]));
        const reordered: Category[] = [];
        orderedIds.forEach((id, idx) => {
          const item = map.get(id);
          if (item) {
            reordered.push({ ...item, order: idx + 1 });
            map.delete(id);
          }
        });
        let tailOrder = reordered.length + 1;
        for (const rem of map.values()) {
          reordered.push({ ...rem, order: tailOrder++ });
        }
        await Promise.all(reordered.map((c) => saveCategoryToFirestore(c)));
        return { categories: reordered };
      },
    );
  },

  deleteCategory: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>(`/api/admin/categories/${id}`, {
          method: 'DELETE',
        });
        if (canUseFirestoreAdmin()) {
          await deleteCategoryFromFirestore(id);
        }
        return res;
      },
      async () => {
        await deleteCategoryFromFirestore(id);
        return { ok: true };
      },
    );
  },

  createArticleCategory: async (name: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ category: ArticleCategory }>('/api/admin/article-categories', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
        if (canUseFirestoreAdmin()) {
          await saveArticleCategoryToFirestore(res.category);
        }
        return res;
      },
      async () => {
        const id = makeClientId('ac');
        const category: ArticleCategory = {
          id,
          name: name.trim(),
          slug: clientSlugify(name) || id,
        };
        await saveArticleCategoryToFirestore(category);
        return { category };
      },
    );
  },

  updateArticleCategory: async (id: string, name: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ category: ArticleCategory }>(
          `/api/admin/article-categories/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify({ name }),
          },
        );
        if (canUseFirestoreAdmin()) {
          await saveArticleCategoryToFirestore(res.category);
        }
        return res;
      },
      async () => {
        const category: ArticleCategory = {
          id,
          name: name.trim(),
          slug: clientSlugify(name) || id,
        };
        await saveArticleCategoryToFirestore(category);
        return { category };
      },
    );
  },

  deleteArticleCategory: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>(`/api/admin/article-categories/${id}`, {
          method: 'DELETE',
        });
        if (canUseFirestoreAdmin()) {
          await deleteArticleCategoryFromFirestore(id);
        }
        return res;
      },
      async () => {
        await deleteArticleCategoryFromFirestore(id);
        return { ok: true };
      },
    );
  },

  createArticle: async (payload: Partial<Article>) => {
    return withServerFallback(
      async () => {
        const res = await request<{ article: Article }>('/api/admin/articles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveArticleToFirestore(res.article);
        }
        return res;
      },
      async () => {
        const now = new Date().toISOString();
        const title = (payload.title || 'Nouvel enseignement').trim();
        const id = makeClientId('art');
        const article: Article = {
          id,
          title,
          slug: clientSlugify(payload.slug || title) || id,
          excerpt: payload.excerpt || '',
          content: payload.content || '',
          image: payload.image || '',
          author: payload.author || 'Maître Élias Varenne',
          categoryId: payload.categoryId || 'ac_enseignements',
          status: payload.status || 'Publié',
          featured: Boolean(payload.featured),
          likesCount: 0,
          likedByKeys: [],
          publishedAt: payload.publishedAt || now,
          createdAt: now,
          updatedAt: now,
        };
        await saveArticleToFirestore(article);
        return { article };
      },
    );
  },

  updateArticle: async (id: string, payload: Partial<Article>) => {
    return withServerFallback(
      async () => {
        const res = await request<{ article: Article }>(`/api/admin/articles/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveArticleToFirestore(res.article);
        }
        return res;
      },
      async () => {
        const existing = await getArticleFromFirestore(id);
        if (!existing) throw new Error('Article introuvable.');
        const updated: Article = {
          ...existing,
          ...payload,
          id: existing.id,
          updatedAt: new Date().toISOString(),
        };
        await saveArticleToFirestore(updated);
        return { article: updated };
      },
    );
  },

  deleteArticle: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>(`/api/admin/articles/${id}`, {
          method: 'DELETE',
        });
        if (canUseFirestoreAdmin()) {
          await deleteArticleFromFirestore(id);
        }
        return res;
      },
      async () => {
        await deleteArticleFromFirestore(id);
        return { ok: true };
      },
    );
  },

  lookupYoutube: (url: string) =>
    withServerFallback(
      () =>
        request<{ youtubeId: string; youtubeUrl: string; title: string; thumbnail: string }>(
          '/api/admin/youtube-lookup',
          { method: 'POST', body: JSON.stringify({ url }) },
        ),
      async () => {
        const youtubeId = extractYoutubeIdClient(url);
        if (!youtubeId) {
          throw new Error('Lien YouTube invalide.');
        }
        const canonicalUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
        let title = '';
        let thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
        const metaRaw = await fetchTextWithTimeout(
          `https://noembed.com/embed?url=${encodeURIComponent(canonicalUrl)}`,
          4500,
        );
        if (metaRaw) {
          try {
            const meta = JSON.parse(metaRaw) as { title?: string; thumbnail_url?: string };
            if (meta.title) title = meta.title;
            if (meta.thumbnail_url) thumbnail = meta.thumbnail_url;
          } catch {
            // Keep default fallback metadata
          }
        }
        return {
          youtubeId,
          youtubeUrl: canonicalUrl,
          title,
          thumbnail,
        };
      },
    ),

  syncYoutubeChannel: async (channelUrl: string, autoSync: boolean) => {
    return withServerFallback(
      async () => {
        const res = await request<{
          addedCount: number;
          added: VideoItem[];
          videos: VideoItem[];
          youtubeSync: NonNullable<SiteSettings['youtubeSync']>;
        }>('/api/admin/videos/sync-channel', {
          method: 'POST',
          body: JSON.stringify({ channelUrl, autoSync }),
        });
        if (canUseFirestoreAdmin()) {
          await Promise.all(res.added.map((v) => saveVideoToFirestore(v)));
          await updateYoutubeSyncInFirestore(res.youtubeSync);
        }
        return res;
      },
      () => syncYoutubeChannelClientDirect(channelUrl, autoSync),
    );
  },

  updateYoutubeSyncSettings: async (patch: { channelUrl?: string; autoSync?: boolean }) => {
    return withServerFallback(
      async () => {
        const res = await request<{ youtubeSync: NonNullable<SiteSettings['youtubeSync']> }>(
          '/api/admin/videos/sync-settings',
          {
            method: 'PATCH',
            body: JSON.stringify(patch),
          },
        );
        if (canUseFirestoreAdmin()) {
          await updateYoutubeSyncInFirestore(res.youtubeSync);
        }
        return res;
      },
      async () => {
        const settings = (await getSiteSettingsFromFirestore()) || createDefaultSiteSettings();
        const prev = settings.youtubeSync || {
          channelUrl: '',
          channelId: '',
          autoSync: true,
          lastSyncAt: null,
        };
        const next: NonNullable<SiteSettings['youtubeSync']> = {
          ...prev,
          ...(patch.channelUrl !== undefined ? { channelUrl: patch.channelUrl.trim() } : {}),
          ...(patch.autoSync !== undefined ? { autoSync: patch.autoSync } : {}),
        };
        await updateYoutubeSyncInFirestore(next);
        return { youtubeSync: next };
      },
    );
  },

  createVideo: async (payload: Partial<VideoItem>) => {
    return withServerFallback(
      async () => {
        const res = await request<{ video: VideoItem }>('/api/admin/videos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveVideoToFirestore(res.video);
        }
        return res;
      },
      async () => {
        const now = new Date().toISOString();
        const youtubeUrl = (payload.youtubeUrl || '').trim();
        const youtubeId = payload.youtubeId || extractYoutubeIdClient(youtubeUrl);
        if (!youtubeId) {
          throw new Error('Lien YouTube invalide.');
        }
        const video: VideoItem = {
          id: makeClientId('vid'),
          title: (payload.title || 'Vidéo').trim(),
          youtubeUrl: youtubeUrl || `https://www.youtube.com/watch?v=${youtubeId}`,
          youtubeId,
          thumbnail: payload.thumbnail || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
          description: payload.description || '',
          duration: payload.duration || '',
          visible: payload.visible !== false,
          featured: Boolean(payload.featured),
          sortOrder: Number(payload.sortOrder) || 1,
          createdAt: now,
        };
        await saveVideoToFirestore(video);
        return { video };
      },
    );
  },

  updateVideo: async (id: string, payload: Partial<VideoItem>) => {
    return withServerFallback(
      async () => {
        const res = await request<{ video: VideoItem }>(`/api/admin/videos/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (canUseFirestoreAdmin()) {
          await saveVideoToFirestore(res.video);
        }
        return res;
      },
      async () => {
        const existing = await getVideoFromFirestore(id);
        if (!existing) throw new Error('Vidéo introuvable.');
        const updated: VideoItem = {
          ...existing,
          ...payload,
          id: existing.id,
        };
        await saveVideoToFirestore(updated);
        return { video: updated };
      },
    );
  },

  reorderVideos: async (orderedIds: string[]) => {
    return withServerFallback(
      async () => {
        const res = await request<{ videos: VideoItem[] }>('/api/admin/videos/reorder', {
          method: 'PUT',
          body: JSON.stringify({ orderedIds }),
        });
        if (canUseFirestoreAdmin()) {
          await Promise.all(res.videos.map((v) => saveVideoToFirestore(v)));
        }
        return res;
      },
      async () => {
        const all = await getAllVideosFromFirestore();
        const map = new Map(all.map((v) => [v.id, v]));
        const reordered: VideoItem[] = [];
        orderedIds.forEach((id, idx) => {
          const item = map.get(id);
          if (item) {
            reordered.push({ ...item, sortOrder: idx + 1 });
            map.delete(id);
          }
        });
        let tailOrder = reordered.length + 1;
        for (const rem of map.values()) {
          reordered.push({ ...rem, sortOrder: tailOrder++ });
        }
        await Promise.all(reordered.map((v) => saveVideoToFirestore(v)));
        return { videos: reordered };
      },
    );
  },

  deleteVideo: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>(`/api/admin/videos/${id}`, {
          method: 'DELETE',
        });
        if (canUseFirestoreAdmin()) {
          await deleteVideoFromFirestore(id);
        }
        return res;
      },
      async () => {
        await deleteVideoFromFirestore(id);
        return { ok: true };
      },
    );
  },

  uploadMedia: async (payload: {
    name: string;
    folder: MediaFolder;
    dataUrl?: string;
    externalUrl?: string;
  }) => {
    return withServerFallback(
      async () => {
        const res = await request<{ media: MediaItem }>('/api/admin/media/upload', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const persistentUrl = payload.dataUrl || payload.externalUrl || res.media.url;
        const persistentMedia: MediaItem = {
          ...res.media,
          url: persistentUrl,
        };
        if (canUseFirestoreAdmin()) {
          await saveMediaToFirestore(persistentMedia);
        }
        return { media: canUseFirestoreAdmin() ? persistentMedia : res.media };
      },
      async () => {
        const url = (payload.dataUrl || payload.externalUrl || '').trim();
        if (!url) {
          throw new Error('Veuillez fournir une image ou une URL valide.');
        }
        if (url.length > 740_000) {
          throw new Error('Image trop volumineuse pour Firebase (maximum ~500 Ko).');
        }
        const media: MediaItem = {
          id: makeClientId('med'),
          name: (payload.name || 'Média').trim(),
          url,
          folder: payload.folder || 'site',
          sizeLabel: payload.dataUrl ? 'Firebase · Image' : 'Lien externe',
          createdAt: new Date().toISOString(),
        };
        await saveMediaToFirestore(media);
        return { media };
      },
    );
  },

  deleteMedia: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>(`/api/admin/media/${id}`, {
          method: 'DELETE',
        });
        if (canUseFirestoreAdmin()) {
          await deleteMediaFromFirestore(id);
        }
        return res;
      },
      async () => {
        await deleteMediaFromFirestore(id);
        return { ok: true };
      },
    );
  },

  updateSiteContent: async (content: SiteContent) => {
    return withServerFallback(
      async () => {
        const res = await request<{ siteContent: SiteContent }>('/api/admin/site-content', {
          method: 'PUT',
          body: JSON.stringify(content),
        });
        if (canUseFirestoreAdmin()) {
          await saveSiteContentToFirestore(res.siteContent);
        }
        return res;
      },
      async () => {
        await saveSiteContentToFirestore(content);
        return { siteContent: content };
      },
    );
  },

  updateSettings: async (settings: SiteSettings, options?: { convertCatalogPrices?: boolean }) => {
    return withServerFallback(
      async () => {
        const res = await request<{ settings: SiteSettings; products?: Product[] }>(
          '/api/admin/settings',
          {
            method: 'PUT',
            body: JSON.stringify({
              ...settings,
              convertCatalogPrices: Boolean(options?.convertCatalogPrices),
            }),
          },
        );
        if (canUseFirestoreAdmin()) {
          await saveSiteSettingsToFirestore(res.settings);
          if (res.products && res.products.length > 0) {
            await Promise.all(res.products.map((p) => saveProductToFirestore(p)));
          }
        }
        return res;
      },
      async () => {
        await saveSiteSettingsToFirestore(settings);
        const products = options?.convertCatalogPrices
          ? await getAllProductsFromFirestore()
          : undefined;
        return { settings, ...(products ? { products } : {}) };
      },
    );
  },

  createAdmin: (payload: {
    name: string;
    email: string;
    password: string;
    role: 'Super Administrateur' | 'Éditeur';
  }) =>
    withServerFallback(
      () =>
        request<{ admin: AdminUserPublic }>('/api/admin/admins', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      async () => {
        const admin: AdminUserPublic = {
          id: makeClientId('adm'),
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
          role: payload.role,
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
        };
        await createAdminMemberInFirestore(admin);
        return { admin };
      },
    ),

  deleteAdmin: (id: string) =>
    withServerFallback(
      () => request<{ ok: boolean }>(`/api/admin/admins/${id}`, { method: 'DELETE' }),
      async () => {
        await deleteAdminMemberFromFirestore(id);
        return { ok: true };
      },
    ),

  changePassword: async (newPassword: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>('/api/admin/admins/password', {
          method: 'POST',
          body: JSON.stringify({ newPassword }),
        });
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, newPassword).catch(() => {});
        }
        return res;
      },
      async () => {
        if (!auth.currentUser) {
          throw new Error('Connexion requise.');
        }
        await updatePassword(auth.currentUser, newPassword);
        return { ok: true };
      },
    );
  },

  updateOwnAdminProfile: (payload: { email: string; name?: string }) =>
    withServerFallback(
      () =>
        request<{ admin: AdminUserPublic }>('/api/admin/admins/me', {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }),
      async () => {
        const user = auth.currentUser;
        if (!user) throw new Error('Connexion requise.');
        if (payload.name?.trim()) {
          await updateProfile(user, { displayName: payload.name.trim() }).catch(() => {});
        }
        const admin: AdminUserPublic = {
          id: user.uid,
          name: payload.name?.trim() || user.displayName || 'Administrateur',
          email: payload.email.trim().toLowerCase() || user.email || '',
          role: 'Super Administrateur',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await createAdminMemberInFirestore(admin);
        return { admin };
      },
    ),

  markMessageRead: async (id: string, read: boolean) => {
    return withServerFallback(
      async () => {
        const res = await request<{ message: ContactMessage }>(`/api/admin/messages/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ read }),
        });
        if (canUseFirestoreAdmin()) {
          await markMessageReadInFirestore(id, read);
        }
        return res;
      },
      async () => {
        await markMessageReadInFirestore(id, read);
        return {
          message: {
            id,
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: '',
            read,
            createdAt: new Date().toISOString(),
          },
        };
      },
    );
  },

  deleteMessage: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>(`/api/admin/messages/${id}`, {
          method: 'DELETE',
        });
        if (canUseFirestoreAdmin()) {
          await deleteMessageFromFirestore(id);
        }
        return res;
      },
      async () => {
        await deleteMessageFromFirestore(id);
        return { ok: true };
      },
    );
  },

  updateTestimonial: async (id: string, patch: { status?: TestimonialStatus; featured?: boolean }) => {
    return withServerFallback(
      async () => {
        const res = await request<{ testimonial: Testimonial }>(`/api/admin/testimonials/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        if (canUseFirestoreAdmin()) {
          await saveTestimonialToFirestore(res.testimonial);
        }
        return res;
      },
      async () => {
        const existing = await getTestimonialFromFirestore(id);
        if (!existing) throw new Error('Témoignage introuvable.');
        const updated: Testimonial = {
          ...existing,
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.featured !== undefined ? { featured: patch.featured } : {}),
        };
        await saveTestimonialToFirestore(updated);
        return { testimonial: updated };
      },
    );
  },

  deleteTestimonial: async (id: string) => {
    return withServerFallback(
      async () => {
        const res = await request<{ ok: boolean }>(`/api/admin/testimonials/${id}`, {
          method: 'DELETE',
        });
        if (canUseFirestoreAdmin()) {
          await deleteTestimonialFromFirestore(id);
        }
        return res;
      },
      async () => {
        await deleteTestimonialFromFirestore(id);
        return { ok: true };
      },
    );
  },
};
