import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { authApi } from '../../lib/api';
import type { AdminUserPublic } from '../../types/cms';

interface AdminLoginPageProps {
  siteName: string;
  onSuccess: (admin: AdminUserPublic) => Promise<void>;
  onBackPublic: () => void;
}

export function AdminLoginPage({ siteName, onSuccess, onBackPublic }: AdminLoginPageProps) {
  const [email, setEmail] = useState('admin@eliasvarenne.fr');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    setLoading(true);
    try {
      const admin = await authApi.login(loginEmail.trim(), loginPassword.trim());
      await onSuccess(admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@eliasvarenne.fr');
    setPassword('Sanctuaire2026');
    await performLogin('admin@eliasvarenne.fr', 'Sanctuaire2026');
  };

  return (
    <div className="min-h-screen bg-[#F6F6F7] flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={onBackPublic}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C5A55] hover:text-[#141413] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au site public</span>
        </button>

        <div className="bg-white border border-[#E3E3E6] rounded-xl p-7 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#2A4036] text-white flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#141413]">Administration · {siteName}</h1>
              <p className="text-xs text-[#5C5A55]">
                Accès réservé à la gestion de la boutique et des contenus
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                Adresse email administrateur
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B6860] hover:text-[#141413]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#2A4036] hover:bg-[#20322A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter au tableau de bord'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F0EFEA] text-xs text-[#5C5A55] space-y-2.5">
            <div>
              <p className="font-medium text-[#141413]">Accès initial administrateur</p>
              <p className="mt-1">
                Email : <code className="font-mono text-[#141413]">admin@eliasvarenne.fr</code>
              </p>
              <p>
                Mot de passe : <code className="font-mono text-[#141413]">Sanctuaire2026</code>
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleQuickDemoLogin}
              className="w-full py-2 px-3 bg-[#F6F6F7] hover:bg-[#EFECE6] border border-[#D9D6CF] text-[#141413] text-xs font-semibold rounded-lg transition-colors"
            >
              Remplir et entrer dans l’administration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
