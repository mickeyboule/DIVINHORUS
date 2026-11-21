import { onAuthStateChanged, signInWithPopup, type User } from 'firebase/auth';
import { Component, createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, googleProvider, isBootstrapAdminEmail } from '../lib/firebase';

interface FirebaseContextValue {
  firebaseUser: User | null;
  authReady: boolean;
  isFirebaseAdmin: boolean;
  signInWithGooglePopup: () => Promise<User>;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseUser: null,
  authReady: false,
  isFirebaseAdmin: false,
  signInWithGooglePopup: async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  },
});

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isFirebaseAdmin = Boolean(
    firebaseUser &&
      firebaseUser.emailVerified &&
      isBootstrapAdminEmail(firebaseUser.email),
  );

  const signInWithGooglePopup = async (): Promise<User> => {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  };

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        authReady,
        isFirebaseAdmin,
        signInWithGooglePopup,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase(): FirebaseContextValue {
  return useContext(FirebaseContext);
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class FirebaseErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'Une erreur inattendue est survenue.';
    try {
      const parsed = JSON.parse(message) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error && parsed.operationType) {
        message = `Erreur Firebase (${parsed.operationType}${parsed.path ? ` · ${parsed.path}` : ''}) : ${parsed.error}`;
      }
    } catch {
      // Standard error message
    }
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F6F7] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E3E3E6] rounded-xl p-6 shadow-xs text-center space-y-4">
            <h2 className="text-lg font-semibold text-[#141413]">Synchronisation interrompue</h2>
            <p className="text-sm text-[#5C5A55] break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#8F6B18] text-white text-sm font-semibold rounded-lg hover:bg-[#735613]"
            >
              Actualiser la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
