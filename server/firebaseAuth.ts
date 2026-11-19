import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function loadFirebaseProjectId(): string {
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) as { projectId?: string };
      if (parsed?.projectId) return parsed.projectId;
    }
  } catch {
    // Fallback below
  }
  return process.env.FIREBASE_PROJECT_ID || 'site-divinhorus';
}

const FIREBASE_PROJECT_ID = loadFirebaseProjectId();
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  signInProvider?: string;
  isAdminClaim?: boolean;
}

interface CertCache {
  certs: Record<string, string>;
  expiresAtMs: number;
}

let certCache: CertCache | null = null;

async function getFirebasePublicCerts(forceRefresh = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && certCache && certCache.expiresAtMs > now) {
    return certCache.certs;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(CERTS_URL, { signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`Impossible de récupérer les certificats Firebase (${resp.status}).`);
    }
    const certs = (await resp.json()) as Record<string, string>;
    const cacheControl = resp.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
    certCache = {
      certs,
      expiresAtMs: now + Math.max(60, maxAgeSec) * 1000,
    };
    return certs;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeBase64UrlJson<T>(segment: string): T {
  try {
    const json = Buffer.from(segment, 'base64url').toString('utf-8');
    return JSON.parse(json) as T;
  } catch {
    throw new Error('Format de jeton Firebase invalide.');
  }
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Jeton Firebase manquant.');
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Format de jeton Firebase invalide.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(headerB64);
  const payload = decodeBase64UrlJson<{
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    auth_time?: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
    admin?: boolean;
    role?: string;
    firebase?: { sign_in_provider?: string };
  }>(payloadB64);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Algorithme ou identifiant de clé Firebase invalide.');
  }

  let certs = await getFirebasePublicCerts(false);
  let cert = certs[header.kid];
  if (!cert) {
    certs = await getFirebasePublicCerts(true);
    cert = certs[header.kid];
  }
  if (!cert) {
    throw new Error('Clé de signature Firebase introuvable.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const signatureBuf = Buffer.from(signatureB64, 'base64url');
  const isValidSignature = verifier.verify(cert, signatureBuf);
  if (!isValidSignature) {
    throw new Error('Signature du jeton Firebase invalide.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const clockSkewSec = 300;

  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error('Projet Firebase du jeton non reconnu.');
  }
  if (payload.iss !== FIREBASE_ISSUER) {
    throw new Error('Émetteur du jeton Firebase invalide.');
  }
  if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) {
    throw new Error('Identifiant utilisateur Firebase invalide.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec - clockSkewSec) {
    throw new Error('Jeton Firebase expiré.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + clockSkewSec) {
    throw new Error('Date d’émission du jeton Firebase invalide.');
  }
  if (typeof payload.auth_time === 'number' && payload.auth_time > nowSec + clockSkewSec) {
    throw new Error('Horodatage d’authentification Firebase invalide.');
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : undefined,
    emailVerified: Boolean(payload.email_verified),
    name: typeof payload.name === 'string' ? payload.name.trim() : undefined,
    signInProvider:
      typeof payload.firebase?.sign_in_provider === 'string'
        ? payload.firebase.sign_in_provider
        : undefined,
    isAdminClaim: payload.admin === true || payload.role === 'admin',
  };
}
