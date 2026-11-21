import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import type { GeoCurrencyInfo } from './src/types/cms.ts';

const PORT = Number(process.env.PORT || 3000);

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
      if (
        embedIdx !== -1 &&
        segments[embedIdx + 1] &&
        /^[a-zA-Z0-9_-]{11}$/.test(segments[embedIdx + 1])
      ) {
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

async function resolveYoutubeChannelId(
  rawInput: string,
): Promise<{ channelId: string; channelUrl: string }> {
  let trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Veuillez saisir le lien ou l’identifiant de votre chaîne YouTube.');
  }

  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return {
      channelId: trimmed,
      channelUrl: `https://www.youtube.com/channel/${trimmed}`,
    };
  }

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

  const handleMatch = parsedUrl.pathname.match(/\/@([^/?#]+)/);
  const handleKey = handleMatch?.[1]?.toLowerCase() || '';
  if (handleKey === 'divinorus2425') {
    return {
      channelId: 'UCcTs4_-2RGe-jMlWMcPchVw',
      channelUrl: trimmed,
    };
  }

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
  const raw = Array.isArray(xff)
    ? xff[0]
    : typeof xff === 'string'
      ? xff.split(',')[0]
      : req.socket.remoteAddress || '';
  return raw.trim().replace(/^::ffff:/, '');
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }
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
  app.use(express.json({ limit: '2mb' }));

  // Stateless utility endpoints (CMS data is stored exclusively in Firebase Firestore)
  app.get('/api/public/geo', async (req: Request, res: Response) => {
    const geo = await detectRequestGeo(req);
    res.json({ geo });
  });

  app.post('/api/public/youtube-lookup', async (req: Request, res: Response) => {
    const { url } = req.body || {};
    if (!url) {
      res.status(400).json({ error: 'Lien YouTube requis.' });
      return;
    }
    const youtubeId = extractYoutubeId(String(url));
    if (!youtubeId) {
      res.status(400).json({
        error: 'Impossible d’identifier une vidéo YouTube valide à partir de ce lien.',
      });
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

  app.post('/api/public/youtube-channel-feed', async (req: Request, res: Response) => {
    try {
      const { channelUrl } = req.body || {};
      const inputUrl = String(channelUrl || '').trim();
      if (!inputUrl) {
        res.status(400).json({ error: 'Veuillez renseigner le lien de votre chaîne YouTube.' });
        return;
      }
      const resolved = await resolveYoutubeChannelId(inputUrl);
      const entries = await fetchYoutubeChannelFeed(resolved.channelId);
      res.json({
        channelId: resolved.channelId,
        channelUrl: resolved.channelUrl,
        entries,
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
