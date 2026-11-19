import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { verifyFirebaseIdToken } from './server/firebaseAuth.ts';
import {
  cmsStore,
  verifyPassword,
  type AdminUserRecord,
  type VisitorMemberRecord,
} from './server/store.ts';
import type {
  GeoCurrencyInfo,
  MediaFolder,
  OrderStatus,
  TestimonialStatus,
} from './src/types/cms.ts';

const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  crypto.createHash('sha256').update(`elias-varenne-session-${process.cwd()}`).digest('hex');

const COOKIE_NAME = 'ev_admin_session';
const VISITOR_COOKIE_NAME = 'ev_visitor_session';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

interface AuthenticatedRequest extends Request {
  adminUser?: AdminUserRecord;
}

interface VisitorRequest extends Request {
  visitorUser?: VisitorMemberRecord;
}

function signRoleToken(id: string, role: 'admin' | 'visitor'): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: id, role, exp: Date.now() + TOKEN_TTL_MS }),
    'utf-8',
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyRoleToken(token: string, expectedRole: 'admin' | 'visitor'): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      sub: string;
      role?: 'admin' | 'visitor';
      exp: number;
    };
    if (!parsed.sub || Date.now() > parsed.exp) return null;
    if (expectedRole === 'admin') {
      if (parsed.role && parsed.role !== 'admin') return null;
    } else if (parsed.role !== 'visitor') {
      return null;
    }
    return parsed.sub;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key === name) {
      return decodeURIComponent(val);
    }
  }
  return null;
}

function extractAdminToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return readCookie(req, COOKIE_NAME);
}

function extractVisitorToken(req: Request): string | null {
  const headerToken = req.headers['x-visitor-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  return readCookie(req, VISITOR_COOKIE_NAME);
}

function resolveOptionalVisitor(req: Request): VisitorMemberRecord | undefined {
  const token = extractVisitorToken(req);
  if (!token) return undefined;
  const visitorId = verifyRoleToken(token, 'visitor');
  if (!visitorId) return undefined;
  return cmsStore.findVisitorById(visitorId);
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractAdminToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentification administrateur requise.' });
    return;
  }
  const adminId = verifyRoleToken(token, 'admin');
  if (!adminId) {
    res.status(401).json({ error: 'Session expirée ou invalide.' });
    return;
  }
  const admin = cmsStore.findAdminById(adminId);
  if (!admin) {
    res.status(401).json({ error: 'Compte administrateur introuvable.' });
    return;
  }
  req.adminUser = admin;
  next();
}

function requireVisitor(req: VisitorRequest, res: Response, next: NextFunction): void {
  const token = extractVisitorToken(req);
  if (!token) {
    res.status(401).json({ error: 'Connexion visiteur requise.' });
    return;
  }
  const visitorId = verifyRoleToken(token, 'visitor');
  if (!visitorId) {
    res.status(401).json({ error: 'Session expirée ou invalide.' });
    return;
  }
  const visitor = cmsStore.findVisitorById(visitorId);
  if (!visitor) {
    res.status(401).json({ error: 'Compte introuvable.' });
    return;
  }
  req.visitorUser = visitor;
  next();
}

function extractYoutubeId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const segments = u.pathname.split('/').filter(Boolean);
      const embedIdx = segments.findIndex((s) => s === 'embed' || s === 'shorts' || s === 'live');
      if (embedIdx !== -1 && segments[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(segments[embedIdx + 1])) {
        return segments[embedIdx + 1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

async function resolveYoutubeChannelId(rawInput: string): Promise<{ channelId: string; channelUrl: string }> {
  let trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Veuillez saisir le lien ou l’identifiant de votre chaîne YouTube.');
  }

  // Direct channel ID (UC...)
  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return {
      channelId: trimmed,
      channelUrl: `https://www.youtube.com/channel/${trimmed}`,
    };
  }

  // Handle without domain (@handle)
  if (trimmed.startsWith('@')) {
    trimmed = `https://www.youtube.com/${trimmed}`;
  } else if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new Error('Lien de chaîne YouTube invalide.');
  }

  if (!parsedUrl.hostname.includes('youtube.com') && !parsedUrl.hostname.includes('youtu.be')) {
    throw new Error('Veuillez indiquer une adresse youtube.com valide.');
  }

  const channelMatch = parsedUrl.pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]{20,})/);
  if (channelMatch) {
    return {
      channelId: channelMatch[1],
      channelUrl: trimmed,
    };
  }

  // Resolve @handle, /c/..., /user/... by fetching the YouTube channel HTML
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const resp = await fetch(trimmed, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
    if (!resp.ok) {
      throw new Error(`Impossible d’accéder à la chaîne YouTube (${resp.status}).`);
    }
    const html = await resp.text();
    const patterns = [
      /"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{20,})"/,
      /"externalId"\s*:\s*"(UC[a-zA-Z0-9_-]{20,})"/,
      /itemprop="identifier"\s+content="(UC[a-zA-Z0-9_-]{20,})"/,
      /https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{20,})/,
    ];
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m && m[1]) {
        return {
          channelId: m[1],
          channelUrl: trimmed,
        };
      }
    }
    throw new Error(
      'Identifiant de chaîne introuvable à partir de ce lien. Essayez le lien direct /channel/UC... ou @identifiant.',
    );
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYoutubeChannelFeed(channelId: string): Promise<
  Array<{
    youtubeId: string;
    title: string;
    description: string;
    thumbnail: string;
    youtubeUrl: string;
    publishedAt: string;
  }>
> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const resp = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/atom+xml, application/xml, text/xml',
      },
    });
    if (!resp.ok) {
      throw new Error(`Flux YouTube indisponible (${resp.status}).`);
    }
    const xml = await resp.text();
    const entries: Array<{
      youtubeId: string;
      title: string;
      description: string;
      thumbnail: string;
      youtubeUrl: string;
      publishedAt: string;
    }> = [];

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

      const rawDesc = descMatch ? decodeXmlEntities(descMatch[1]) : '';
      const shortDesc = rawDesc.length > 220 ? `${rawDesc.slice(0, 217).trim()}...` : rawDesc;

      entries.push({
        youtubeId,
        title: titleMatch ? decodeXmlEntities(titleMatch[1]) : `Vidéo (${youtubeId})`,
        description: shortDesc,
        thumbnail: thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
        publishedAt: pubMatch ? pubMatch[1].trim() : new Date().toISOString(),
      });
    }
    return entries;
  } finally {
    clearTimeout(timer);
  }
}

let lastAutoSyncAttemptMs = 0;
let autoSyncPromise: Promise<void> | null = null;
const AUTO_SYNC_INTERVAL_MS = 1000 * 60 * 3; // Check at most every 3 minutes on traffic

async function runAutoYoutubeSync(force = false): Promise<void> {
  const cfg = cmsStore.getYoutubeSyncSettings();
  if (!force && !cfg.autoSync) return;
  if (!cfg.channelId && !cfg.channelUrl) return;
  const now = Date.now();
  if (!force && now - lastAutoSyncAttemptMs < AUTO_SYNC_INTERVAL_MS) return;
  if (autoSyncPromise) return autoSyncPromise;

  lastAutoSyncAttemptMs = now;
  autoSyncPromise = (async () => {
    try {
      let channelId = cfg.channelId;
      let channelUrl = cfg.channelUrl;
      if (!channelId && channelUrl) {
        const resolved = await resolveYoutubeChannelId(channelUrl);
        channelId = resolved.channelId;
        channelUrl = resolved.channelUrl;
      }
      if (!channelId) return;
      const entries = await fetchYoutubeChannelFeed(channelId);
      cmsStore.syncChannelVideos(entries, channelUrl, channelId, 'Synchronisation YouTube');
    } catch {
      // Fail silently on background auto-sync
    } finally {
      autoSyncPromise = null;
    }
  })();

  return autoSyncPromise;
}

const DEFAULT_EUR_RATES: Record<string, number> = {
  EUR: 1,
  XOF: 655.957,
  XAF: 655.957,
  USD: 1.08,
  CAD: 1.5,
  CHF: 0.94,
  GBP: 0.84,
  MAD: 10.85,
  TND: 3.38,
  DZD: 145,
  CDF: 3050,
  GNF: 9300,
  MGA: 4950,
  HTG: 142,
};

let cachedRates: Record<string, number> = { ...DEFAULT_EUR_RATES };
let lastRatesFetchMs = 0;
const RATES_REFRESH_MS = 1000 * 60 * 60 * 12;

async function refreshExchangeRatesInBackground(): Promise<void> {
  const now = Date.now();
  if (now - lastRatesFetchMs < RATES_REFRESH_MS) return;
  lastRatesFetchMs = now;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const resp = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,CAD,CHF,GBP', {
      signal: controller.signal,
    });
    if (!resp.ok) return;
    const json = (await resp.json()) as { rates?: Record<string, number> };
    if (json && json.rates) {
      cachedRates = {
        ...DEFAULT_EUR_RATES,
        ...cachedRates,
        ...json.rates,
        EUR: 1,
        XOF: 655.957,
        XAF: 655.957,
      };
    }
  } catch {
    // Silent fallback to DEFAULT_EUR_RATES
  } finally {
    clearTimeout(timer);
  }
}

const ipCountryCache = new Map<string, { code: string; exp: number }>();

function extractClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : typeof xff === 'string' ? xff.split(',')[0] : req.socket.remoteAddress || '';
  return raw.trim().replace(/^::ffff:/, '');
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  return false;
}

async function detectRequestGeo(req: Request): Promise<GeoCurrencyInfo> {
  void refreshExchangeRatesInBackground();

  const headerKeys = [
    'cf-ipcountry',
    'x-vercel-ip-country',
    'x-appengine-country',
    'cloudfront-viewer-country',
    'x-country-code',
    'fly-client-country',
  ];
  for (const h of headerKeys) {
    const val = req.headers[h];
    const code = (Array.isArray(val) ? val[0] : val || '').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1' && code !== 'ZZ') {
      return { countryCode: code, source: 'header', rates: cachedRates };
    }
  }

  const ip = extractClientIp(req);
  if (!isPrivateOrLocalIp(ip)) {
    const cached = ipCountryCache.get(ip);
    if (cached && cached.exp > Date.now()) {
      return { countryCode: cached.code, source: 'ip', rates: cachedRates };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 900);
    try {
      const resp = await fetch(`https://api.country.is/${encodeURIComponent(ip)}`, {
        signal: controller.signal,
      });
      if (resp.ok) {
        const json = (await resp.json()) as { country?: string };
        const code = (json?.country || '').trim().toUpperCase();
        if (/^[A-Z]{2}$/.test(code)) {
          ipCountryCache.set(ip, { code, exp: Date.now() + 1000 * 60 * 60 * 6 });
          return { countryCode: code, source: 'ip', rates: cachedRates };
        }
      }
    } catch {
      // Ignore network/timeout errors and fall through
    } finally {
      clearTimeout(timer);
    }
  }

  const acceptLang = req.headers['accept-language'];
  if (typeof acceptLang === 'string') {
    const match = acceptLang.match(/[a-z]{2}[-_]([A-Z]{2})/i);
    if (match && match[1]) {
      return {
        countryCode: match[1].toUpperCase(),
        source: 'accept-language',
        rates: cachedRates,
      };
    }
  }

  return { countryCode: 'FR', source: 'default', rates: cachedRates };
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '30mb' }));
  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    const e = err as { type?: string; status?: number; message?: string };
    if (e?.type === 'entity.too.large' || e?.status === 413) {
      res.status(413).json({
        error: 'Le fichier envoyé est trop volumineux (limite 30 Mo). Veuillez choisir une image plus légère.',
      });
      return;
    }
    if (e instanceof SyntaxError) {
      res.status(400).json({ error: 'Format de requête JSON invalide.' });
      return;
    }
    next(err);
  });
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Periodic background YouTube channel sync every 10 minutes
  setInterval(() => {
    void runAutoYoutubeSync(false);
  }, 1000 * 60 * 10);

  // ---------------- PUBLIC API ----------------

  app.get('/api/public/bootstrap', async (req, res) => {
    const [, geo] = await Promise.all([
      Promise.race([
        runAutoYoutubeSync(false),
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
      ]),
      detectRequestGeo(req),
    ]);
    res.json({
      ...cmsStore.getPublicBootstrap(),
      geo,
    });
  });

  app.post('/api/public/orders', async (req, res) => {
    try {
      const visitor = resolveOptionalVisitor(req);
      if (!visitor) {
        res.status(401).json({
          error: 'Veuillez vous connecter ou créer un compte pour valider votre commande.',
          code: 'auth-required',
        });
        return;
      }
      const {
        firstName,
        lastName,
        phone,
        email,
        deliveryAddress,
        message,
        items,
        customerCountry,
        displayCurrencyCode,
        displayCurrencySymbol,
        displayTotal,
      } = req.body || {};
      if (!firstName || !lastName || !phone || !deliveryAddress) {
        res.status(400).json({ error: 'Veuillez renseigner votre nom, prénom, téléphone et adresse de livraison.' });
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Veuillez sélectionner au moins un produit.' });
        return;
      }
      const resolvedCountry =
        typeof customerCountry === 'string' && customerCountry.trim()
          ? customerCountry.trim().toUpperCase()
          : (await detectRequestGeo(req)).countryCode;
      const order = cmsStore.createOrder({
        firstName: String(firstName),
        lastName: String(lastName),
        phone: String(phone),
        email: email ? String(email) : '',
        deliveryAddress: String(deliveryAddress),
        message: message ? String(message) : '',
        items,
        visitorId: visitor?.id,
        customerCountry: resolvedCountry,
        displayCurrencyCode: typeof displayCurrencyCode === 'string' ? displayCurrencyCode : undefined,
        displayCurrencySymbol:
          typeof displayCurrencySymbol === 'string' ? displayCurrencySymbol : undefined,
        displayTotal: typeof displayTotal === 'number' ? displayTotal : undefined,
      });
      const updatedVisitor = visitor ? cmsStore.findVisitorById(visitor.id) : undefined;
      const publicVisitor = updatedVisitor
        ? (({ passwordHash: _ph, salt: _s, firebaseUid: _fu, ...pub }) => pub)(updatedVisitor)
        : undefined;
      res.status(201).json({ order, ...(publicVisitor ? { visitor: publicVisitor } : {}) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement de la commande.';
      res.status(400).json({ error: msg });
    }
  });

  app.post('/api/public/contact', (req, res) => {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Veuillez remplir votre nom, votre email et votre message.' });
      return;
    }
    const created = cmsStore.createContactMessage({
      name: String(name),
      email: String(email),
      phone: phone ? String(phone) : '',
      subject: subject ? String(subject) : 'Message depuis le site',
      message: String(message),
    });
    res.status(201).json({ message: created });
  });

  app.post('/api/public/orders/track', (req, res) => {
    const { orderNumber, contact } = req.body || {};
    if (!orderNumber || !contact) {
      res.status(400).json({ error: 'Veuillez renseigner votre numéro de commande et votre email ou téléphone.' });
      return;
    }
    const order = cmsStore.trackOrder(String(orderNumber), String(contact));
    if (!order) {
      res.status(404).json({ error: 'Aucune commande trouvée avec ces informations.' });
      return;
    }
    res.json({ order });
  });

  app.post('/api/public/articles/:id/like', (req, res) => {
    const visitor = resolveOptionalVisitor(req);
    const clientKey = typeof req.body?.clientKey === 'string' ? req.body.clientKey.trim() : '';
    const actorKey = visitor ? `visitor:${visitor.id}` : clientKey ? `anon:${clientKey}` : '';
    if (!actorKey) {
      res.status(400).json({ error: 'Identifiant visiteur requis.' });
      return;
    }
    const result = cmsStore.toggleArticleLike(req.params.id, actorKey);
    if (!result) {
      res.status(404).json({ error: 'Article introuvable.' });
      return;
    }
    res.json(result);
  });

  app.post('/api/public/testimonials', (req, res) => {
    const { authorName, authorLocation, rating, content } = req.body || {};
    if (!authorName || !String(authorName).trim() || !content || !String(content).trim()) {
      res.status(400).json({ error: 'Veuillez renseigner votre nom et votre témoignage.' });
      return;
    }
    if (String(content).trim().length < 10) {
      res.status(400).json({ error: 'Votre témoignage doit contenir au moins 10 caractères.' });
      return;
    }
    const visitor = resolveOptionalVisitor(req);
    const created = cmsStore.createTestimonial({
      authorName: String(authorName),
      authorLocation: authorLocation ? String(authorLocation) : '',
      rating: Number(rating) || 5,
      content: String(content),
      visitorId: visitor?.id,
    });
    res.status(201).json({ testimonial: created });
  });

  // ---------------- VISITOR AUTH API ----------------

  app.post('/api/visitor/register', async (req, res) => {
    try {
      const { firstName, lastName, email, phone, address, country, password, firebaseIdToken } =
        req.body || {};
      if (!firstName || !lastName || !email || (!password && !firebaseIdToken)) {
        res
          .status(400)
          .json({ error: 'Prénom, nom, email et mot de passe (6 caractères min.) requis.' });
        return;
      }
      if (password && String(password).length < 6) {
        res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
        return;
      }

      let firebaseUid: string | undefined;
      if (typeof firebaseIdToken === 'string' && firebaseIdToken.trim()) {
        const verified = await verifyFirebaseIdToken(firebaseIdToken.trim());
        firebaseUid = verified.uid;
      }

      const visitor = cmsStore.registerVisitor({
        firstName: String(firstName),
        lastName: String(lastName),
        email: String(email),
        phone: phone ? String(phone) : '',
        address: address ? String(address) : '',
        country: country ? String(country) : '',
        password: password ? String(password) : crypto.randomBytes(24).toString('hex'),
        firebaseUid,
      });
      const record = cmsStore.findVisitorById(visitor.id)!;
      const orders = cmsStore.getOrdersForVisitor(record);
      const token = signRoleToken(visitor.id, 'visitor');
      const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
      const cookieFlags = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
      res.setHeader(
        'Set-Cookie',
        `${VISITOR_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${cookieFlags}; Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
      );
      res.status(201).json({ visitor, orders, token });
    } catch (err) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : 'Erreur lors de la création du compte.' });
    }
  });

  app.post('/api/visitor/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe requis.' });
      return;
    }
    const visitor = cmsStore.findVisitorByEmail(String(email).trim());
    if (!visitor || !verifyPassword(String(password).trim(), visitor.passwordHash, visitor.salt)) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      return;
    }
    const orders = cmsStore.getOrdersForVisitor(visitor);
    const token = signRoleToken(visitor.id, 'visitor');
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const cookieFlags = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
    res.setHeader(
      'Set-Cookie',
      `${VISITOR_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${cookieFlags}; Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
    );
    const { passwordHash: _ph, salt: _s, ...pub } = visitor;
    res.json({ visitor: pub, orders, token });
  });

  app.post('/api/visitor/logout', (req, res) => {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const cookieFlags = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
    res.setHeader('Set-Cookie', `${VISITOR_COOKIE_NAME}=; Path=/; HttpOnly; ${cookieFlags}; Max-Age=0`);
    res.json({ ok: true });
  });

  app.get('/api/visitor/me', requireVisitor, (req: VisitorRequest, res) => {
    const visitor = req.visitorUser!;
    const orders = cmsStore.getOrdersForVisitor(visitor);
    const { passwordHash: _ph, salt: _s, ...pub } = visitor;
    res.json({ visitor: pub, orders });
  });

  app.patch('/api/visitor/profile', requireVisitor, (req: VisitorRequest, res) => {
    const { firstName, lastName, phone, address, country } = req.body || {};
    const updated = cmsStore.updateVisitorProfile(req.visitorUser!.id, {
      firstName: firstName ? String(firstName) : req.visitorUser!.firstName,
      lastName: lastName ? String(lastName) : req.visitorUser!.lastName,
      phone: phone !== undefined ? String(phone) : req.visitorUser!.phone,
      address: address !== undefined ? String(address) : req.visitorUser!.address,
      country: country !== undefined ? String(country) : req.visitorUser!.country,
    });
    if (!updated) {
      res.status(404).json({ error: 'Compte introuvable.' });
      return;
    }
    const record = cmsStore.findVisitorById(updated.id)!;
    const orders = cmsStore.getOrdersForVisitor(record);
    res.json({ visitor: updated, orders });
  });

  // ---------------- UNIFIED & AUTH API ----------------

  app.post('/api/auth/firebase-session', async (req, res) => {
    try {
      const { idToken, mode = 'unified', profile } = req.body || {};
      if (!idToken || typeof idToken !== 'string') {
        res.status(400).json({ error: 'Jeton d’authentification Firebase requis.' });
        return;
      }

      const verified = await verifyFirebaseIdToken(idToken);
      const isSocialOAuth =
        verified.signInProvider === 'google.com' || verified.signInProvider === 'facebook.com';
      if (!isSocialOAuth && !verified.emailVerified) {
        res.status(403).json({
          error: `Nous vous avons envoyé un e-mail de vérification à ${verified.email || 'votre adresse e-mail'}. Veuillez le vérifier et vous connecter.`,
          code: 'email-not-verified',
          email: verified.email || '',
        });
        return;
      }

      const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
      const cookieFlags = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';

      if (mode !== 'visitor') {
        const envAdminEmails = [
          'bisnessweb24@gmail.com',
          'coeurdouce2401@gmail.com',
          ...(process.env.ADMIN_EMAILS || '')
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean),
        ];
        const isAuthorizedFirebaseAdmin =
          Boolean(verified.isAdminClaim) ||
          (verified.email ? envAdminEmails.includes(verified.email.toLowerCase()) : false);

        let admin =
          cmsStore.findAdminByFirebaseUid(verified.uid) ||
          (verified.email ? cmsStore.findAdminByEmail(verified.email) : undefined);

        if (!admin && isAuthorizedFirebaseAdmin && verified.email) {
          admin = cmsStore.ensureAdminFromFirebase({
            uid: verified.uid,
            email: verified.email,
            name: verified.name,
          });
        }

        if (admin) {
          cmsStore.linkAdminFirebaseUid(admin.id, verified.uid);
          cmsStore.touchAdminLogin(admin.id);
          const token = signRoleToken(admin.id, 'admin');
          res.setHeader(
            'Set-Cookie',
            `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${cookieFlags}; Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
          );
          const { passwordHash: _ph, salt: _s, firebaseUid: _fu, ...pub } = admin;
          res.json({ role: 'admin', admin: pub, token });
          return;
        }

        if (mode === 'admin') {
          res.status(403).json({ error: 'Ce compte n’est pas autorisé à accéder à l’administration.' });
          return;
        }
      }

      const visitorRecord = cmsStore.findOrCreateVisitorFromFirebase({
        uid: verified.uid,
        email: verified.email,
        name: verified.name,
        firstName: typeof profile?.firstName === 'string' ? profile.firstName : undefined,
        lastName: typeof profile?.lastName === 'string' ? profile.lastName : undefined,
        phone: typeof profile?.phone === 'string' ? profile.phone : undefined,
        address: typeof profile?.address === 'string' ? profile.address : undefined,
        country: typeof profile?.country === 'string' ? profile.country : undefined,
      });
      const orders = cmsStore.getOrdersForVisitor(visitorRecord);
      const token = signRoleToken(visitorRecord.id, 'visitor');
      res.setHeader(
        'Set-Cookie',
        `${VISITOR_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${cookieFlags}; Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
      );
      const { passwordHash: _ph, salt: _s, firebaseUid: _fu, ...pub } = visitorRecord;
      res.json({ role: 'visitor', visitor: pub, orders, token });
    } catch (err) {
      res.status(401).json({
        error: err instanceof Error ? err.message : 'Session Firebase invalide ou expirée.',
      });
    }
  });

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe requis.' });
      return;
    }
    const cleanEmail = String(email).trim();
    const cleanPassword = String(password).trim();
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const cookieFlags = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';

    // Check admin first — invisible automatic redirect to administration
    const admin = cmsStore.findAdminByEmail(cleanEmail);
    if (admin && verifyPassword(cleanPassword, admin.passwordHash, admin.salt)) {
      cmsStore.touchAdminLogin(admin.id);
      const token = signRoleToken(admin.id, 'admin');
      res.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${cookieFlags}; Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
      );
      const { passwordHash: _ph, salt: _s, ...pub } = admin;
      res.json({ role: 'admin', admin: pub, token });
      return;
    }

    // Check visitor account
    const visitor = cmsStore.findVisitorByEmail(cleanEmail);
    if (visitor && verifyPassword(cleanPassword, visitor.passwordHash, visitor.salt)) {
      const orders = cmsStore.getOrdersForVisitor(visitor);
      const token = signRoleToken(visitor.id, 'visitor');
      res.setHeader(
        'Set-Cookie',
        `${VISITOR_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${cookieFlags}; Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
      );
      const { passwordHash: _ph, salt: _s, ...pub } = visitor;
      res.json({ role: 'visitor', visitor: pub, orders, token });
      return;
    }

    res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe requis.' });
      return;
    }
    const admin = cmsStore.findAdminByEmail(String(email).trim());
    if (!admin || !verifyPassword(String(password).trim(), admin.passwordHash, admin.salt)) {
      res.status(401).json({ error: 'Identifiants incorrects.' });
      return;
    }
    cmsStore.touchAdminLogin(admin.id);
    const token = signRoleToken(admin.id, 'admin');
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const cookieFlags = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${cookieFlags}; Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`,
    );
    const { passwordHash: _ph, salt: _s, ...pub } = admin;
    res.json({ admin: pub, token });
  });

  app.post('/api/auth/logout', (req, res) => {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const cookieFlags = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; ${cookieFlags}; Max-Age=0`);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAdmin, (req: AuthenticatedRequest, res) => {
    if (!req.adminUser) {
      res.status(401).json({ error: 'Non autorisé.' });
      return;
    }
    const { passwordHash: _ph, salt: _s, ...pub } = req.adminUser;
    res.json({ admin: pub });
  });

  // ---------------- ADMIN API (PROTECTED) ----------------

  app.get('/api/admin/bootstrap', requireAdmin, async (_req, res) => {
    await Promise.race([
      runAutoYoutubeSync(false),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]);
    res.json(cmsStore.getAdminBootstrap());
  });

  app.patch('/api/admin/orders/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { status, adminNotes, statusNote } = req.body || {};
    const validStatuses: OrderStatus[] = [
      'Nouvelle',
      'En cours',
      'Confirmée',
      'En expédition',
      'Terminée',
      'Annulée',
    ];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Statut de commande invalide.' });
      return;
    }
    const updated = cmsStore.updateOrder(
      req.params.id,
      { status, adminNotes, statusNote },
      req.adminUser!.name,
    );
    if (!updated) {
      res.status(404).json({ error: 'Commande introuvable.' });
      return;
    }
    res.json({ order: updated });
  });

  app.put('/api/admin/orders/:id/invoice', requireAdmin, (req: AuthenticatedRequest, res) => {
    const result = cmsStore.saveOrderInvoice(req.params.id, req.body || {}, req.adminUser!.name);
    if (!result) {
      res.status(404).json({ error: 'Commande introuvable.' });
      return;
    }
    res.json(result);
  });

  app.post('/api/admin/customers', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { firstName, lastName, phone, email, country, address, notes } = req.body || {};
      const customer = cmsStore.createCustomer(
        {
          firstName: String(firstName || ''),
          lastName: String(lastName || ''),
          phone: phone ? String(phone) : '',
          email: email ? String(email) : '',
          country: country ? String(country) : '',
          address: address ? String(address) : '',
          notes: notes ? String(notes) : '',
        },
        req.adminUser!.name,
      );
      res.status(201).json({ customer });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur création client.' });
    }
  });

  app.patch('/api/admin/customers/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { firstName, lastName, phone, email, country, address, notes } = req.body || {};
    const updated = cmsStore.updateCustomer(
      req.params.id,
      {
        ...(typeof firstName === 'string' ? { firstName } : {}),
        ...(typeof lastName === 'string' ? { lastName } : {}),
        ...(typeof phone === 'string' ? { phone } : {}),
        ...(typeof email === 'string' ? { email } : {}),
        ...(typeof country === 'string' ? { country } : {}),
        ...(typeof address === 'string' ? { address } : {}),
        ...(typeof notes === 'string' ? { notes } : {}),
      },
      req.adminUser!.name,
    );
    if (!updated) {
      res.status(404).json({ error: 'Client introuvable.' });
      return;
    }
    res.json({ customer: updated });
  });

  app.delete('/api/admin/customers/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const ok = cmsStore.deleteCustomer(req.params.id, req.adminUser!.name);
    if (!ok) {
      res.status(404).json({ error: 'Client introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/products', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const product = cmsStore.upsertProduct(req.body, req.adminUser!.name);
      res.status(201).json({ product });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur création produit.' });
    }
  });

  app.put('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const product = cmsStore.upsertProduct({ ...req.body, id: req.params.id }, req.adminUser!.name);
      res.json({ product });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur mise à jour produit.' });
    }
  });

  app.post('/api/admin/products/:id/duplicate', requireAdmin, (req: AuthenticatedRequest, res) => {
    const copy = cmsStore.duplicateProduct(req.params.id, req.adminUser!.name);
    if (!copy) {
      res.status(404).json({ error: 'Produit introuvable.' });
      return;
    }
    res.status(201).json({ product: copy });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const ok = cmsStore.deleteProduct(req.params.id, req.adminUser!.name);
    if (!ok) {
      res.status(404).json({ error: 'Produit introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/categories', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const category = cmsStore.upsertCategory(req.body, req.adminUser!.name);
      res.status(201).json({ category });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur création catégorie.' });
    }
  });

  app.put('/api/admin/categories/reorder', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'Liste ordonnée requise.' });
      return;
    }
    const categories = cmsStore.reorderCategories(orderedIds, req.adminUser!.name);
    res.json({ categories });
  });

  app.put('/api/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const category = cmsStore.upsertCategory({ ...req.body, id: req.params.id }, req.adminUser!.name);
      res.json({ category });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur modification catégorie.' });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const ok = cmsStore.deleteCategory(req.params.id, req.adminUser!.name);
    if (!ok) {
      res.status(404).json({ error: 'Catégorie introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/article-categories', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { name } = req.body || {};
    if (!name) {
      res.status(400).json({ error: 'Nom requis.' });
      return;
    }
    const category = cmsStore.upsertArticleCategory({ name: String(name) }, req.adminUser!.name);
    res.status(201).json({ category });
  });

  app.put('/api/admin/article-categories/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const category = cmsStore.upsertArticleCategory(
        { id: req.params.id, name: String(req.body?.name || '') },
        req.adminUser!.name,
      );
      res.json({ category });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur modification.' });
    }
  });

  app.delete('/api/admin/article-categories/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const ok = cmsStore.deleteArticleCategory(req.params.id, req.adminUser!.name);
    if (!ok) {
      res.status(404).json({ error: 'Catégorie introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/articles', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const article = cmsStore.upsertArticle(req.body, req.adminUser!.name);
      res.status(201).json({ article });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur création article.' });
    }
  });

  app.put('/api/admin/articles/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const article = cmsStore.upsertArticle({ ...req.body, id: req.params.id }, req.adminUser!.name);
      res.json({ article });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur mise à jour article.' });
    }
  });

  app.delete('/api/admin/articles/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const ok = cmsStore.deleteArticle(req.params.id, req.adminUser!.name);
    if (!ok) {
      res.status(404).json({ error: 'Article introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/youtube-lookup', requireAdmin, async (req, res) => {
    const { url } = req.body || {};
    if (!url) {
      res.status(400).json({ error: 'Lien YouTube requis.' });
      return;
    }
    const youtubeId = extractYoutubeId(String(url));
    if (!youtubeId) {
      res.status(400).json({ error: 'Impossible d’identifier une vidéo YouTube valide à partir de ce lien.' });
      return;
    }
    const canonicalUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    const fallbackThumb = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    let title = `Enseignement vidéo (${youtubeId})`;
    let thumbnail = fallbackThumb;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`,
        { signal: controller.signal },
      );
      clearTimeout(timeout);
      if (resp.ok) {
        const meta = (await resp.json()) as { title?: string; thumbnail_url?: string };
        if (meta.title) title = meta.title;
        if (meta.thumbnail_url) thumbnail = meta.thumbnail_url;
      }
    } catch {
      // Fallback gracefully to extracted YouTube ID & official thumbnail URL
    }

    res.json({ youtubeId, youtubeUrl: canonicalUrl, title, thumbnail });
  });

  app.post('/api/admin/videos/sync-channel', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { channelUrl, autoSync } = req.body || {};
      const inputUrl = String(channelUrl || cmsStore.getYoutubeSyncSettings().channelUrl || '').trim();
      if (!inputUrl) {
        res.status(400).json({ error: 'Veuillez renseigner le lien de votre chaîne YouTube.' });
        return;
      }
      if (typeof autoSync === 'boolean') {
        cmsStore.updateYoutubeSyncSettings({ autoSync });
      }
      const resolved = await resolveYoutubeChannelId(inputUrl);
      const entries = await fetchYoutubeChannelFeed(resolved.channelId);
      const result = cmsStore.syncChannelVideos(
        entries,
        resolved.channelUrl,
        resolved.channelId,
        req.adminUser!.name,
      );
      lastAutoSyncAttemptMs = Date.now();
      res.json({
        addedCount: result.added.length,
        added: result.added,
        videos: cmsStore.getAdminBootstrap().videos,
        youtubeSync: result.youtubeSync,
      });
    } catch (err) {
      res.status(400).json({
        error:
          err instanceof Error
            ? err.message
            : 'Impossible de synchroniser cette chaîne YouTube.',
      });
    }
  });

  app.patch('/api/admin/videos/sync-settings', requireAdmin, (req, res) => {
    const { channelUrl, autoSync } = req.body || {};
    const youtubeSync = cmsStore.updateYoutubeSyncSettings({
      ...(typeof channelUrl === 'string' ? { channelUrl } : {}),
      ...(typeof autoSync === 'boolean' ? { autoSync } : {}),
    });
    res.json({ youtubeSync });
  });

  app.post('/api/admin/videos', requireAdmin, (req: AuthenticatedRequest, res) => {
    const body = req.body || {};
    const youtubeId = body.youtubeId || extractYoutubeId(String(body.youtubeUrl || ''));
    if (!youtubeId) {
      res.status(400).json({ error: 'Lien ou identifiant YouTube invalide.' });
      return;
    }
    const video = cmsStore.upsertVideo(
      {
        ...body,
        youtubeId,
        youtubeUrl: body.youtubeUrl || `https://www.youtube.com/watch?v=${youtubeId}`,
        thumbnail: body.thumbnail || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      },
      req.adminUser!.name,
    );
    res.status(201).json({ video });
  });

  app.put('/api/admin/videos/reorder', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'Liste ordonnée requise.' });
      return;
    }
    const videos = cmsStore.reorderVideos(orderedIds, req.adminUser!.name);
    res.json({ videos });
  });

  app.put('/api/admin/videos/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body || {};
      const youtubeId = body.youtubeUrl ? extractYoutubeId(String(body.youtubeUrl)) || body.youtubeId : body.youtubeId;
      const video = cmsStore.upsertVideo(
        { ...body, id: req.params.id, ...(youtubeId ? { youtubeId } : {}) },
        req.adminUser!.name,
      );
      res.json({ video });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur modification vidéo.' });
    }
  });

  app.delete('/api/admin/videos/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const ok = cmsStore.deleteVideo(req.params.id, req.adminUser!.name);
    if (!ok) {
      res.status(404).json({ error: 'Vidéo introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/media/upload', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { name, folder, dataUrl, externalUrl } = req.body || {};
      const targetFolder: MediaFolder = ['produits', 'articles', 'categories', 'site'].includes(folder)
        ? folder
        : 'site';

      if (externalUrl) {
        const created = cmsStore.addMedia(
          {
            name: String(name || 'Image externe'),
            url: String(externalUrl),
            folder: targetFolder,
            sizeLabel: 'Lien externe',
          },
          req.adminUser!.name,
        );
        res.status(201).json({ media: created });
        return;
      }

      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ error: 'Fichier image ou lien requis.' });
        return;
      }

      const match = dataUrl.match(
        /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml|avif|bmp|x-icon|vnd\.microsoft\.icon);base64,(.+)$/i,
      );
      if (!match) {
        res.status(400).json({
          error: 'Format d’image non pris en charge (PNG, JPG, WEBP, GIF, SVG, AVIF, ICO).',
        });
        return;
      }

      const rawSubtype = match[1].toLowerCase();
      const ext =
        rawSubtype === 'jpeg'
          ? 'jpg'
          : rawSubtype === 'svg+xml'
            ? 'svg'
            : rawSubtype === 'x-icon' || rawSubtype === 'vnd.microsoft.icon'
              ? 'ico'
              : rawSubtype;
      const buffer = Buffer.from(match[2], 'base64');
      const fileName = `media_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);

      const kb = Math.max(1, Math.round(buffer.length / 1024));
      const created = cmsStore.addMedia(
        {
          name: String(name || fileName),
          url: `/uploads/${fileName}`,
          folder: targetFolder,
          sizeLabel: `${kb} Ko · ${ext.toUpperCase()}`,
        },
        req.adminUser!.name,
      );
      res.status(201).json({ media: created });
    } catch {
      res.status(400).json({ error: 'Impossible de téléverser ce média.' });
    }
  });

  app.delete('/api/admin/media/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const ok = cmsStore.deleteMedia(req.params.id, req.adminUser!.name);
    if (!ok) {
      res.status(404).json({ error: 'Média introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  app.put('/api/admin/site-content', requireAdmin, (req: AuthenticatedRequest, res) => {
    const updated = cmsStore.updateSiteContent(req.body, req.adminUser!.name);
    res.json({ siteContent: updated });
  });

  app.put('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const convertCatalogPrices = Boolean(body.convertCatalogPrices);
    const { convertCatalogPrices: _ignored, ...settingsPayload } = body;
    const result = cmsStore.updateSettings(
      settingsPayload as unknown as Parameters<typeof cmsStore.updateSettings>[0],
      req.adminUser!.name,
      { convertCatalogPrices, rates: cachedRates },
    );
    res.json(result);
  });

  app.post('/api/admin/admins', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { name, email, password, role } = req.body || {};
      if (!name || !email || !password || String(password).length < 6) {
        res.status(400).json({ error: 'Nom, email et mot de passe (6 caractères min.) requis.' });
        return;
      }
      const admin = cmsStore.createAdmin(
        {
          name: String(name),
          email: String(email),
          password: String(password),
          role: role === 'Éditeur' ? 'Éditeur' : 'Super Administrateur',
        },
        req.adminUser!.name,
      );
      res.status(201).json({ admin });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur création administrateur.' });
    }
  });

  app.delete('/api/admin/admins/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const ok = cmsStore.deleteAdmin(req.params.id, req.adminUser!.id, req.adminUser!.name);
      if (!ok) {
        res.status(404).json({ error: 'Administrateur introuvable.' });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur suppression.' });
    }
  });

  app.post('/api/admin/admins/password', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    cmsStore.changeAdminPassword(req.adminUser!.id, String(newPassword), req.adminUser!.name);
    res.json({ ok: true });
  });

  app.patch('/api/admin/admins/me', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { email, name } = req.body || {};
      const admin = cmsStore.updateAdminProfile(
        req.adminUser!.id,
        {
          ...(typeof email === 'string' ? { email } : {}),
          ...(typeof name === 'string' ? { name } : {}),
        },
        req.adminUser!.name,
      );
      res.json({ admin });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du compte.',
      });
    }
  });

  app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
    const updated = cmsStore.markMessageRead(req.params.id, Boolean(req.body?.read));
    if (!updated) {
      res.status(404).json({ error: 'Message introuvable.' });
      return;
    }
    res.json({ message: updated });
  });

  app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
    const ok = cmsStore.deleteContactMessage(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Message introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  app.patch('/api/admin/testimonials/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { status, featured } = req.body || {};
    const validStatuses: TestimonialStatus[] = ['Publié', 'En attente', 'Masqué'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Statut de témoignage invalide.' });
      return;
    }
    const updated = cmsStore.updateTestimonial(
      req.params.id,
      { status, featured },
      req.adminUser!.name,
    );
    if (!updated) {
      res.status(404).json({ error: 'Témoignage introuvable.' });
      return;
    }
    res.json({ testimonial: updated });
  });

  app.delete('/api/admin/testimonials/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const ok = cmsStore.deleteTestimonial(req.params.id, req.adminUser!.name);
    if (!ok) {
      res.status(404).json({ error: 'Témoignage introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  // ---------------- VITE / STATIC SERVING ----------------

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
