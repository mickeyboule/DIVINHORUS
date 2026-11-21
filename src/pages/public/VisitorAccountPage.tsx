import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Heart,
  LogOut,
  MessageCircle,
  Package,
  Save,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { CountrySelect } from '../../components/CountrySelect';
import { EmailVerificationScreen } from '../../components/EmailVerificationScreen';
import { InvoicePreview } from '../../components/InvoicePreview';
import { SafeImage } from '../../components/SafeImage';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { visitorApi } from '../../lib/api';
import { formatCountryWithFlag } from '../../lib/countries';
import { formatAmountWithCurrency, getCurrencyOptionByCode } from '../../lib/currency';
import { EmailNotVerifiedError } from '../../lib/firebase';
import {
  formatDateFr,
  formatDateTimeFr,
  getInvoicePaymentStatusLabel,
  getOrderStatusStyle,
} from '../../lib/format';
import { getCountryDisplayName } from '../../lib/shipping';
import { buildOrderWhatsappUrl } from '../../lib/whatsapp';
import type {
  AdminUserPublic,
  Article,
  Order,
  SiteSettings,
  VisitorMemberPublic,
} from '../../types/cms';

interface VisitorAccountPageProps {
  visitorUser: VisitorMemberPublic | null;
  visitorOrders: Order[];
  articles: Article[];
  settings: SiteSettings;
  onAuthSuccess: (visitor: VisitorMemberPublic, orders: Order[]) => void;
  onAdminAuthSuccess: (admin: AdminUserPublic) => Promise<void>;
  onProfileUpdated: (visitor: VisitorMemberPublic, orders: Order[]) => void;
  onLogout: () => Promise<void>;
  onNavigate: (path: string) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function VisitorAccountPage({
  visitorUser,
  visitorOrders,
  articles,
  settings,
  onAuthSuccess,
  onAdminAuthSuccess,
  onProfileUpdated,
  onLogout,
  onNavigate,
  onNotify,
}: VisitorAccountPageProps) {
  const { formatClientPrice } = useCurrency();
  const { lang, t } = useLanguage();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [authError, setAuthError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  // Login / Register state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');

  // Logged-in workspace tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'likes' | 'profile'>('orders');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    visitorOrders[0]?.id || null,
  );
  const [invoiceOrderModal, setInvoiceOrderModal] = useState<Order | null>(null);
  const [copiedOrderLinkId, setCopiedOrderLinkId] = useState<string | null>(null);

  // Profile editing state
  const [profFirst, setProfFirst] = useState(visitorUser?.firstName || '');
  const [profLast, setProfLast] = useState(visitorUser?.lastName || '');
  const [profPhone, setProfPhone] = useState(visitorUser?.phone || '');
  const [profCountry, setProfCountry] = useState(visitorUser?.country || '');
  const [profAddress, setProfAddress] = useState(visitorUser?.address || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (visitorUser) {
      setProfFirst(visitorUser.firstName || '');
      setProfLast(visitorUser.lastName || '');
      setProfPhone(visitorUser.phone || '');
      setProfCountry(visitorUser.country || '');
      setProfAddress(visitorUser.address || '');
    } else {
      setProfFirst('');
      setProfLast('');
      setProfPhone('');
      setProfCountry('');
      setProfAddress('');
    }
  }, [
    visitorUser?.id,
    visitorUser?.firstName,
    visitorUser?.lastName,
    visitorUser?.phone,
    visitorUser?.country,
    visitorUser?.address,
  ]);

  useEffect(() => {
    if (visitorOrders.length > 0 && !expandedOrderId) {
      setExpandedOrderId(visitorOrders[0].id);
    }
  }, [visitorOrders, expandedOrderId]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      if (authMode === 'login') {
        const res = await visitorApi.unifiedLogin(email.trim(), password.trim());
        if (res.role === 'admin') {
          await onAdminAuthSuccess(res.admin);
          return;
        }
        setProfFirst(res.visitor.firstName);
        setProfLast(res.visitor.lastName);
        setProfPhone(res.visitor.phone);
        setProfCountry(res.visitor.country || '');
        setProfAddress(res.visitor.address);
        onAuthSuccess(res.visitor, res.orders);
        onNotify('success', t('account.welcomeBack', { name: res.visitor.firstName }));
      } else {
        if (!country.trim()) {
          setAuthError(t('account.errSelectCountry'));
          setLoading(false);
          return;
        }
        if (password.trim().length < 6) {
          setAuthError(t('account.errPasswordLength'));
          setLoading(false);
          return;
        }
        const res = await visitorApi.register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country.trim().toUpperCase(),
          address: address.trim(),
          password: password.trim(),
        });
        setPassword('');
        setVerificationEmail(res.email);
      }
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        setPassword('');
        setAuthError('');
        setVerificationEmail(err.email || email.trim());
        return;
      }
      setAuthError(err instanceof Error ? err.message : t('account.errGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    setAuthError('');
    setSocialLoading(provider);
    try {
      const res = await visitorApi.signInWithProvider(provider);
      if (res.role === 'admin') {
        await onAdminAuthSuccess(res.admin);
        return;
      }
      setProfFirst(res.visitor.firstName);
      setProfLast(res.visitor.lastName);
      setProfPhone(res.visitor.phone);
      setProfCountry(res.visitor.country || '');
      setProfAddress(res.visitor.address);
      onAuthSuccess(res.visitor, res.orders);
      onNotify('success', t('account.welcomeBack', { name: res.visitor.firstName }));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : t('account.errSocial'));
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await visitorApi.updateProfile({
        firstName: profFirst,
        lastName: profLast,
        phone: profPhone,
        country: profCountry,
        address: profAddress,
      });
      onProfileUpdated(res.visitor, res.orders);
      onNotify('success', t('account.profileUpdated'));
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : t('account.profileUpdateError'));
    } finally {
      setSavingProfile(false);
    }
  };

  if (!visitorUser) {
    if (verificationEmail) {
      return (
        <div className="bg-[#FAF9F6] min-h-[75vh] py-12 sm:py-16">
          <div className="max-w-lg mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <p className="text-xs font-medium text-[#8F6B18] tracking-wide">
                {t('account.kicker')}
              </p>
              <h1 className="mt-2 font-display text-4xl font-semibold text-[#141413]">
                {t('account.verifyEmailTitle')}
              </h1>
            </div>

            <EmailVerificationScreen
              email={verificationEmail}
              onGoToLogin={() => {
                setEmail(verificationEmail);
                setPassword('');
                setAuthError('');
                setAuthMode('login');
                setVerificationEmail(null);
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#FAF9F6] min-h-[75vh] py-12 sm:py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-medium text-[#8F6B18] tracking-wide">
              {t('account.kicker')}
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-[#141413]">
              {authMode === 'login' ? t('account.loginTitle') : t('account.registerTitle')}
            </h1>
            <p className="mt-2 text-sm text-[#5C5A55]">
              {t('account.subtitle')}
            </p>
          </div>

          <div className="bg-white border border-[#E6E4DF] rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#EFECE6] rounded-lg mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  authMode === 'login'
                    ? 'bg-white text-[#141413] shadow-xs'
                    : 'text-[#5C5A55] hover:text-[#141413]'
                }`}
              >
                {t('account.loginTab')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  authMode === 'register'
                    ? 'bg-white text-[#141413] shadow-xs'
                    : 'text-[#5C5A55] hover:text-[#141413]'
                }`}
              >
                {t('account.registerTab')}
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                        {t('account.firstName')} <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t('account.firstNamePlaceholder')}
                        className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                        {t('account.lastName')} <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={t('account.lastNamePlaceholder')}
                        className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="register-country"
                      className="block text-xs font-medium text-[#3F3E3A] mb-1"
                    >
                      {t('account.country')} <span className="text-red-700">*</span>
                    </label>
                    <CountrySelect
                      id="register-country"
                      value={country}
                      onChange={setCountry}
                      required
                      placeholder={t('account.countryPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                      {t('account.phoneRecommended')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('account.phonePlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                      {t('account.usualAddressOptional')}
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('account.addressPlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                  {t('account.emailAddress')} <span className="text-red-700">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('account.emailPlaceholder')}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                  {t('account.password')} <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      authMode === 'register' ? t('account.passwordMinPlaceholder') : '••••••••'
                    }
                    className="w-full pl-3 pr-10 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('account.hide') : t('account.show')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6860] hover:text-[#141413]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || socialLoading !== null}
                className="w-full py-2.5 px-4 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading
                  ? t('account.loading')
                  : authMode === 'login'
                    ? t('account.accessSpace')
                    : t('account.createSpace')}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-[#E6E4DF]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11px] font-medium text-[#6B6860] uppercase tracking-wider">
                  {t('account.or')}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={loading || socialLoading !== null}
                onClick={() => void handleSocialAuth('google')}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF9F6] border border-[#D9D6CF] hover:border-[#141413] disabled:opacity-50 text-[#141413] text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2.5"
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
                  {socialLoading === 'google'
                    ? t('account.googleLoading')
                    : authMode === 'register'
                      ? t('account.googleSignup')
                      : t('account.googleContinue')}
                </span>
              </button>

              <button
                type="button"
                disabled={loading || socialLoading !== null}
                onClick={() => void handleSocialAuth('facebook')}
                className="w-full py-2.5 px-4 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
                </svg>
                <span>
                  {socialLoading === 'facebook'
                    ? t('account.facebookLoading')
                    : authMode === 'register'
                      ? t('account.facebookSignup')
                      : t('account.facebookContinue')}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/suivi-commande')}
              className="text-xs font-medium text-[#5C5A55] hover:text-[#141413] underline"
            >
              {t('account.trackWithoutAccount')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const likedArticles = articles.filter((a) =>
    a.likedByKeys?.includes(`visitor:${visitorUser.id}`),
  );

  return (
    <div className="bg-[#FAF9F6] min-h-[75vh] py-12 sm:py-16">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E6E4DF]">
          <div>
            <p className="text-xs font-medium text-[#8F6B18] tracking-wide">
              {t('account.kicker')}
            </p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#141413]">
              {t('account.hello', {
                name: `${visitorUser.firstName} ${visitorUser.lastName}`.trim(),
              })}
            </h1>
            <p className="mt-1 text-sm text-[#5C5A55]">
              {visitorUser.email}
              {visitorUser.country ? ` · ${formatCountryWithFlag(visitorUser.country, lang)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/suivi-commande')}
              className="px-4 py-2 text-xs font-medium bg-white border border-[#D9D6CF] rounded-lg hover:border-[#141413] transition-colors"
            >
              {t('account.searchOtherOrder')}
            </button>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#5C5A55] hover:text-red-700 bg-white border border-[#D9D6CF] rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('account.logout')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'orders'
                ? 'bg-[#8F6B18] text-white'
                : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="tabular-nums">
              {t('account.tabOrders', { count: visitorOrders.length })}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('likes')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'likes'
                ? 'bg-[#8F6B18] text-white'
                : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span className="tabular-nums">
              {t('account.tabLikes', { count: likedArticles.length })}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setProfFirst(visitorUser.firstName);
              setProfLast(visitorUser.lastName);
              setProfPhone(visitorUser.phone);
              setProfCountry(visitorUser.country || '');
              setProfAddress(visitorUser.address);
              setActiveTab('profile');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#8F6B18] text-white'
                : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('account.tabProfile')}</span>
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="mt-6 space-y-4">
            {visitorOrders.length === 0 ? (
              <div className="bg-white border border-[#E6E4DF] rounded-xl p-10 text-center">
                <Package className="w-7 h-7 mx-auto text-[#8A877E] mb-2" />
                <p className="text-sm font-medium text-[#141413]">
                  {t('account.noOrdersTitle')}
                </p>
                <p className="mt-1 text-xs text-[#5C5A55]">
                  {t('account.noOrdersDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/boutique')}
                  className="mt-5 px-5 py-2.5 bg-[#8F6B18] text-white text-xs font-semibold rounded-lg"
                >
                  {t('account.discoverShop')}
                </button>
              </div>
            ) : (
              visitorOrders.map((ord) => {
                const isExpanded = expandedOrderId === ord.id;
                return (
                  <div
                    key={ord.id}
                    className="bg-white border border-[#E6E4DF] rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                      className="w-full px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-[#FAF9F6] transition-colors"
                    >
                      <div>
                        <p className="text-xs font-mono tabular-nums text-[#5C5A55]">
                          #{ord.orderNumber} · {formatDateFr(ord.createdAt, lang)}
                        </p>
                        <p className="text-sm font-semibold text-[#141413] mt-0.5">
                          {ord.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <span className="text-sm font-mono tabular-nums font-semibold text-[#141413]">
                          {formatClientPrice(ord.indicativeTotal)}
                        </span>
                        {ord.invoice?.status === 'Envoyée' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-[#8F6B18]/10 text-[#8F6B18] border border-[#8F6B18]/25">
                            <FileText className="w-3 h-3" />
                            <span>{t('account.invoiceReady')}</span>
                          </span>
                        )}
                        {(() => {
                          const st = getOrderStatusStyle(ord.status, lang);
                          return (
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${st.bg} ${st.text} ${st.border}`}
                            >
                              {st.label}
                            </span>
                          );
                        })()}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 py-5 border-t border-[#EFECE6] bg-[#FAF9F6] grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div>
                          <p className="font-semibold text-[#141413] mb-2">
                            {t('account.itemsDetail')}
                          </p>
                          <div className="space-y-2">
                            {ord.items.map((item) => (
                              <div key={item.productId} className="flex items-center justify-between">
                                <span className="text-[#3F3E3A]">
                                  {item.quantity} × {item.productName}
                                </span>
                                <span className="font-mono tabular-nums text-[#141413]">
                                  {formatClientPrice(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {typeof ord.shippingFee === 'number' && (
                            <div className="mt-3 pt-2.5 border-t border-[#E6E4DF] space-y-1">
                              <div className="flex items-center justify-between text-[#5C5A55]">
                                <span>{t('account.productsSubtotal')}</span>
                                <span className="font-mono tabular-nums text-[#141413]">
                                  {formatClientPrice(
                                    ord.subtotal ??
                                      Math.max(0, ord.indicativeTotal - ord.shippingFee),
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[#5C5A55]">
                                <span>
                                  {t('account.delivery', {
                                    country: getCountryDisplayName(ord.customerCountry, lang),
                                  })}
                                </span>
                                <span className="font-mono tabular-nums text-[#141413]">
                                  {ord.shippingFee === 0
                                    ? t('account.freeShipping')
                                    : formatClientPrice(ord.shippingFee)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between font-semibold text-[#141413] pt-1">
                                <span>{t('account.grandTotal')}</span>
                                <span className="font-mono tabular-nums">
                                  {formatClientPrice(ord.indicativeTotal)}
                                </span>
                              </div>
                            </div>
                          )}
                          <p className="mt-3 pt-3 border-t border-[#E6E4DF] text-[#5C5A55]">
                            <strong className="text-[#141413]">{t('account.deliveryLabel')}</strong>{' '}
                            {ord.deliveryAddress}
                          </p>
                          {ord.invoice?.status === 'Envoyée' && (
                            <div className="mt-4 p-3.5 rounded-lg bg-white border border-[#8F6B18]/30 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-[#141413]">
                                  {t('account.invoiceNum', { num: ord.invoice.invoiceNumber })}
                                </span>
                                <span className="text-[11px] font-medium text-[#8F6B18]">
                                  {getInvoicePaymentStatusLabel(ord.invoice.paymentStatus, lang)}
                                </span>
                              </div>
                              <p className="text-[#5C5A55]">
                                <strong className="text-[#141413]">
                                  {t('account.paymentMethod')}
                                </strong>{' '}
                                {ord.invoice.paymentMethod}
                              </p>
                              <button
                                type="button"
                                onClick={() => setInvoiceOrderModal(ord)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#8F6B18] hover:bg-[#735613] text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{t('account.viewInvoicePay')}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-[#141413] mb-2">
                            {t('account.stepsTracking')}
                          </p>
                          <div className="space-y-2.5">
                            {ord.history.map((h, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#8F6B18] shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-[#141413]">
                                    {getOrderStatusStyle(h.status, lang).label}{' '}
                                    <span className="font-normal font-mono tabular-nums text-[#6B6860]">
                                      · {formatDateTimeFr(h.date, lang)}
                                    </span>
                                  </p>
                                  <p className="text-[#5C5A55]">{h.note}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {(() => {
                            const formattedTotal =
                              typeof ord.displayTotal === 'number' && ord.displayCurrencySymbol
                                ? formatAmountWithCurrency(
                                    ord.displayTotal,
                                    ord.displayCurrencySymbol,
                                    getCurrencyOptionByCode(
                                      ord.displayCurrencyCode,
                                      ord.displayCurrencySymbol,
                                    ).decimals,
                                    lang,
                                  )
                                : formatClientPrice(ord.indicativeTotal);
                            const { whatsappUrl, adminOrderUrl } = buildOrderWhatsappUrl(
                              ord,
                              settings,
                              formattedTotal,
                              undefined,
                              lang,
                            );
                            return (
                              <div className="mt-4 pt-4 border-t border-[#E6E4DF] flex flex-wrap items-center gap-2">
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#128C7E] hover:bg-[#0E7367] text-white text-xs font-semibold rounded-lg transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>{t('account.notifyWhatsapp')}</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                      void navigator.clipboard.writeText(adminOrderUrl);
                                    }
                                    setCopiedOrderLinkId(ord.id);
                                    setTimeout(
                                      () =>
                                        setCopiedOrderLinkId((prev) =>
                                          prev === ord.id ? null : prev,
                                        ),
                                      2000,
                                    );
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D9D6CF] hover:border-[#141413] text-[#141413] text-xs font-medium rounded-lg"
                                >
                                  {copiedOrderLinkId === ord.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-[#8F6B18]" />
                                      <span>{t('account.linkCopied')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>{t('account.copyLink')}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Liked Articles Tab */}
        {activeTab === 'likes' && (
          <div className="mt-6">
            {likedArticles.length === 0 ? (
              <div className="bg-white border border-[#E6E4DF] rounded-xl p-10 text-center">
                <Heart className="w-7 h-7 mx-auto text-[#8A877E] mb-2" />
                <p className="text-sm font-medium text-[#141413]">
                  {t('account.noLikesTitle')}
                </p>
                <p className="mt-1 text-xs text-[#5C5A55]">
                  {t('account.noLikesDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/communaute')}
                  className="mt-5 px-5 py-2.5 bg-[#8F6B18] text-white text-xs font-semibold rounded-lg"
                >
                  {t('account.exploreCommunity')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedArticles.map((art) => (
                  <article
                    key={art.id}
                    className="bg-white border border-[#E6E4DF] rounded-xl overflow-hidden flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => onNavigate(`/communaute/${art.slug}`)}
                      className="block w-full aspect-[4/3] bg-[#F3F2EE] overflow-hidden"
                    >
                      <SafeImage
                        src={art.image}
                        alt={art.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[11px] text-[#6B6860]">
                          {formatDateFr(art.publishedAt, lang)}
                        </p>
                        <h3 className="mt-1 font-display text-xl font-semibold text-[#141413]">
                          {art.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/communaute/${art.slug}`)}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F6B18] hover:underline"
                      >
                        <span>{t('account.readAgain')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 max-w-xl bg-white border border-[#E6E4DF] rounded-xl p-6 space-y-4 text-xs"
          >
            <h2 className="text-base font-semibold text-[#141413]">
              {t('account.profileHeading')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">
                  {t('account.firstName')}
                </label>
                <input
                  type="text"
                  required
                  value={profFirst}
                  onChange={(e) => setProfFirst(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">
                  {t('account.lastName')}
                </label>
                <input
                  type="text"
                  required
                  value={profLast}
                  onChange={(e) => setProfLast(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
            </div>
            <div>
              <label htmlFor="profile-country" className="block font-medium text-[#3F3E3A] mb-1">
                {t('account.country')}
              </label>
              <CountrySelect
                id="profile-country"
                value={profCountry}
                onChange={setProfCountry}
                placeholder={t('account.countryPlaceholder')}
              />
            </div>
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">
                {t('account.phone')}
              </label>
              <input
                type="tel"
                value={profPhone}
                onChange={(e) => setProfPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">
                {t('account.usualAddress')}
              </label>
              <input
                type="text"
                value={profAddress}
                onChange={(e) => setProfAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white font-semibold rounded-lg"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? t('common.saving') : t('account.saveProfile')}</span>
            </button>
          </form>
        )}
      </div>

      {invoiceOrderModal && invoiceOrderModal.invoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('account.invoiceModalAria', {
            invoiceNumber: invoiceOrderModal.invoice.invoiceNumber,
          })}
        >
          <div
            className="fixed inset-0 bg-black/50 no-print"
            onClick={() => setInvoiceOrderModal(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-[#FAF9F6] border border-[#E3E3E6] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-[#E3E3E6] flex items-center justify-between no-print">
              <h3 className="text-base font-semibold text-[#141413]">
                {t('account.invoiceModalTitle', {
                  invoiceNumber: invoiceOrderModal.invoice.invoiceNumber,
                  orderNumber: invoiceOrderModal.orderNumber,
                })}
              </h3>
              <button
                type="button"
                onClick={() => setInvoiceOrderModal(null)}
                aria-label={t('common.close')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5A55] hover:bg-[#F3F2EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <InvoicePreview
                invoice={invoiceOrderModal.invoice}
                orderNumber={invoiceOrderModal.orderNumber}
                settings={settings}
                showPrintButton
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
