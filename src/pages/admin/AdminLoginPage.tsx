import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { EmailVerificationScreen } from '../../components/EmailVerificationScreen';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useLanguage } from '../../contexts/LanguageContext';
import { authApi } from '../../lib/api';
import { EmailNotVerifiedError } from '../../lib/firebase';
import type { AdminUserPublic } from '../../types/cms';

interface AdminLoginPageProps {
  siteName: string;
  onSuccess: (admin: AdminUserPublic) => Promise<void>;
  onBackPublic: () => void;
}

export function AdminLoginPage({ siteName, onSuccess, onBackPublic }: AdminLoginPageProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    setLoading(true);
    try {
      const admin = await authApi.login(loginEmail.trim(), loginPassword.trim());
      await onSuccess(admin);
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        setPassword('');
        setError('');
        setVerificationEmail(err.email || loginEmail.trim());
        return;
      }
      setError(err instanceof Error ? err.message : t('admin.invalidCreds'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const admin = await authApi.loginWithGoogle();
      await onSuccess(admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.invalidCreds'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F7] flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={onBackPublic}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C5A55] hover:text-[#141413]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('admin.backPublic')}</span>
          </button>
          <LanguageSwitcher variant="compact" />
        </div>

        {verificationEmail ? (
          <EmailVerificationScreen
            email={verificationEmail}
            onGoToLogin={() => {
              setEmail(verificationEmail);
              setPassword('');
              setError('');
              setVerificationEmail(null);
            }}
          />
        ) : (
          <div className="bg-white border border-[#E3E3E6] rounded-xl p-7 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#8F6B18] text-white flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#141413]">
                  {t('admin.loginTitle', { siteName })}
                </h1>
                <p className="text-xs text-[#5C5A55]">{t('admin.loginSubtitle')}</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF9F6] disabled:opacity-50 border border-[#D9D6CF] text-[#141413] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>
                {googleLoading ? t('admin.loggingIn') : 'Continuer avec Google (Firebase)'}
              </span>
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E3E3E6]" />
              <span className="text-[11px] font-medium text-[#6B6860] uppercase">ou</span>
              <div className="h-px flex-1 bg-[#E3E3E6]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                  {t('admin.emailLabel')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('account.emailPlaceholder')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                  {t('admin.passwordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('admin.passwordPlaceholder')}
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? t('admin.hidePassword') : t('admin.showPassword')
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B6860] hover:text-[#141413]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading ? t('admin.loggingIn') : t('admin.loginSubmit')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
