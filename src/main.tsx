import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { FirebaseErrorBoundary, FirebaseProvider } from './contexts/FirebaseContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <FirebaseErrorBoundary>
    <FirebaseProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </FirebaseProvider>
  </FirebaseErrorBoundary>,
);
