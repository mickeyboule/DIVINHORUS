import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  FacebookAuthProvider,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

void setPersistence(auth, browserLocalPersistence).catch(() => {
  // Ignore persistence errors in restricted environments; memory persistence remains active.
});

export const BOOTSTRAP_ADMIN_EMAILS = ['bisnessweb24@gmail.com', 'coeurdouce2401@gmail.com'] as const;

export function isBootstrapAdminEmail(email?: string | null): boolean {
  const clean = (email || '').trim().toLowerCase();
  return BOOTSTRAP_ADMIN_EMAILS.includes(clean as (typeof BOOTSTRAP_ADMIN_EMAILS)[number]);
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export class EmailNotVerifiedError extends Error {
  public readonly email: string;

  constructor(email: string) {
    super(
      `Nous vous avons envoyé un e-mail de vérification à ${email}. Veuillez le vérifier et vous connecter.`,
    );
    this.name = 'EmailNotVerifiedError';
    this.email = email;
  }
}

export function getFirebaseErrorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return String((err as { code?: unknown }).code || '');
  }
  return '';
}

export function translateFirebaseAuthError(err: unknown): string {
  const code = getFirebaseErrorCode(err);
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cette adresse email.';
    case 'auth/invalid-email':
      return 'Veuillez saisir une adresse email valide.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect.';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives de connexion. Veuillez patienter quelques instants.';
    case 'auth/operation-not-allowed':
      return 'Ce fournisseur de connexion (E-mail, Google ou Facebook) n’est pas encore activé dans la console Firebase (Authentication → Sign-in method).';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre de connexion a été fermée avant la fin de l’opération.';
    case 'auth/cancelled-popup-request':
      return 'Une autre fenêtre de connexion est déjà ouverte.';
    case 'auth/popup-blocked':
      return 'Votre navigateur a bloqué la fenêtre contextuelle. Veuillez autoriser les pop-ups pour ce site.';
    case 'auth/account-exists-with-different-credential':
      return 'Un compte existe déjà avec cette adresse e-mail via une autre méthode de connexion.';
    case 'auth/unauthorized-domain':
      return 'Ce domaine n’est pas encore autorisé dans Firebase Authentication (Settings → Authorized domains).';
    case 'auth/requires-recent-login':
      return 'Par sécurité, veuillez vous reconnecter avant d’effectuer cette modification.';
    case 'auth/network-request-failed':
      return 'Impossible de joindre Firebase Authentication. Vérifiez votre connexion internet.';
    default:
      if (err instanceof Error && err.message) {
        return err.message;
      }
      return 'Erreur d’authentification Firebase.';
  }
}
