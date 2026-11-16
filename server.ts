import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  cmsStore,
  verifyPassword,
  type AdminUserRecord,
  type VisitorMemberRecord,
} from './server/store.ts';
import type { MediaFolder, OrderStatus, TestimonialStatus } from './src/types/cms.ts';

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

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // ---------------- PUBLIC API ----------------

  app.get('/api/public/bootstrap', (_req, res) => {
    res.json(cmsStore.getPublicBootstrap());
  });

  app.post('/api/public/orders', (req, res) => {
    try {
      const { firstName, lastName, phone, email, deliveryAddress, message, items } = req.body || {};
      if (!firstName || !lastName || !phone || !deliveryAddress) {
        res.status(400).json({ error: 'Veuillez renseigner votre nom, prénom, téléphone et adresse de livraison.' });
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Veuillez sélectionner au moins un produit.' });
        return;
      }
      const order = cmsStore.createOrder({
        firstName: String(firstName),
        lastName: String(lastName),
        phone: String(phone),
        email: email ? String(email) : '',
        deliveryAddress: String(deliveryAddress),
        message: message ? String(message) : '',
        items,
      });
      res.status(201).json({ order });
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

  app.post('/api/visitor/register', (req, res) => {
    try {
      const { firstName, lastName, email, phone, address, password } = req.body || {};
      if (!firstName || !lastName || !email || !password || String(password).length < 6) {
        res.status(400).json({ error: 'Prénom, nom, email et mot de passe (6 caractères min.) requis.' });
        return;
      }
      const visitor = cmsStore.registerVisitor({
        firstName: String(firstName),
        lastName: String(lastName),
        email: String(email),
        phone: phone ? String(phone) : '',
        address: address ? String(address) : '',
        password: String(password),
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
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur lors de la création du compte.' });
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
    const { firstName, lastName, phone, address } = req.body || {};
    const updated = cmsStore.updateVisitorProfile(req.visitorUser!.id, {
      firstName: firstName ? String(firstName) : req.visitorUser!.firstName,
      lastName: lastName ? String(lastName) : req.visitorUser!.lastName,
      phone: phone !== undefined ? String(phone) : req.visitorUser!.phone,
      address: address !== undefined ? String(address) : req.visitorUser!.address,
    });
    if (!updated) {
      res.status(404).json({ error: 'Compte introuvable.' });
      return;
    }
    const record = cmsStore.findVisitorById(updated.id)!;
    const orders = cmsStore.getOrdersForVisitor(record);
    res.json({ visitor: updated, orders });
  });

  // ---------------- AUTH API ----------------

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

  app.get('/api/admin/bootstrap', requireAdmin, (_req, res) => {
    res.json(cmsStore.getAdminBootstrap());
  });

  app.patch('/api/admin/orders/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { status, adminNotes, statusNote } = req.body || {};
    const validStatuses: OrderStatus[] = ['Nouvelle', 'En cours', 'Confirmée', 'Terminée', 'Annulée'];
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

  app.patch('/api/admin/customers/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const { notes } = req.body || {};
    const updated = cmsStore.updateCustomerNotes(req.params.id, String(notes ?? ''), req.adminUser!.name);
    if (!updated) {
      res.status(404).json({ error: 'Client introuvable.' });
      return;
    }
    res.json({ customer: updated });
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

      const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,(.+)$/i);
      if (!match) {
        res.status(400).json({ error: 'Format d’image non pris en charge (PNG, JPG, WEBP, SVG).' });
        return;
      }

      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase().replace('+xml', '');
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
    const updated = cmsStore.updateSettings(req.body, req.adminUser!.name);
    res.json({ settings: updated });
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
