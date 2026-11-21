import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Lock,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { publicApi, visitorApi } from '../lib/api';
import { formatAmountWithCurrency, getCurrencyOptionByCode } from '../lib/currency';
import { EmailNotVerifiedError } from '../lib/firebase';
import { getCountryDisplayName, resolveShippingFeeForCountry } from '../lib/shipping';
import { buildOrderWhatsappUrl } from '../lib/whatsapp';
import type { Order, Product, SiteSettings, VisitorMemberPublic } from '../types/cms';
import { CountrySelect } from './CountrySelect';
import { SafeImage } from './SafeImage';

export interface BasketItem {
  product: Product;
  quantity: number;
}

interface OrderDrawerProps {
  open: boolean;
  onClose: () => void;
  items: BasketItem[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearBasket: () => void;
  allProducts: Product[];
  onAddProduct: (product: Product) => void;
  settings: SiteSettings;
  visitorUser: VisitorMemberPublic | null;
  onVisitorAuthenticated: (visitor: VisitorMemberPublic, orders: Order[]) => void;
  onNavigate: (path: string) => void;
  onOrderSuccess: (order: Order, updatedVisitor?: VisitorMemberPublic) => void;
}

export function OrderDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearBasket,
  allProducts,
  onAddProduct,
  settings,
  visitorUser,
  onVisitorAuthenticated,
  onNavigate,
  onOrderSuccess,
}: OrderDrawerProps) {
  const { lang, t } = useLanguage();
  const {
    countryOption,
    autoEnabled,
    availableCountries,
    setCountryOverride,
    formatClientPrice,
    convertClientAmount,
  } = useCurrency();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null);

  // Inline checkout authentication gate state
  const [authStepOpen, setAuthStepOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authReadyBanner, setAuthReadyBanner] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authShowPassword, setAuthShowPassword] = useState(false);
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authCountry, setAuthCountry] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authSocialLoading, setAuthSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [authError, setAuthError] = useState('');
  const [suggestSwitchToLogin, setSuggestSwitchToLogin] = useState(false);

  const CHECKOUT_CONTACT_KEY = 'dh_checkout_contact_v1';

  useEffect(() => {
    if (!open) return;
    let savedGuest: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      deliveryAddress: string;
    }> = {};
    try {
      const raw = localStorage.getItem(CHECKOUT_CONTACT_KEY);
      if (raw) savedGuest = JSON.parse(raw);
    } catch {
      // Ignore storage access errors
    }

    setFirstName((prev) => prev || visitorUser?.firstName || savedGuest.firstName || '');
    setLastName((prev) => prev || visitorUser?.lastName || savedGuest.lastName || '');
    setPhone((prev) => prev || visitorUser?.phone || savedGuest.phone || '');
    setEmail((prev) => prev || visitorUser?.email || savedGuest.email || '');
    setDeliveryAddress(
      (prev) => prev || visitorUser?.address || savedGuest.deliveryAddress || '',
    );
  }, [open, visitorUser]);

  if (!open) return null;

  const productsSubtotal = items.reduce(
    (sum, entry) => sum + entry.product.price * entry.quantity,
    0,
  );
  const shippingInfo = resolveShippingFeeForCountry(
    countryOption.countryCode,
    settings.orderSettings,
    lang,
  );
  const grandTotal = Math.round((productsSubtotal + shippingInfo.fee) * 100) / 100;
  const availableToAdd = allProducts.filter(
    (p) => p.active && p.availability !== 'Rupture' && !items.some((i) => i.product.id === p.id),
  );

  const handleClose = () => {
    setConfirmedOrder(null);
    setCopiedField(null);
    setError('');
    setAuthStepOpen(false);
    setAuthError('');
    setAuthPassword('');
    setAuthReadyBanner(false);
    setSuggestSwitchToLogin(false);
    onClose();
  };

  const handleCopy = (field: 'code' | 'link', value: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField((prev) => (prev === field ? null : prev)), 2000);
  };

  const persistCheckoutContact = (vals: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    deliveryAddress: string;
  }) => {
    try {
      localStorage.setItem(CHECKOUT_CONTACT_KEY, JSON.stringify(vals));
    } catch {
      // Ignore storage errors
    }
  };

  const openAuthPrompt = (preferredMode: 'login' | 'register' = 'login') => {
    setAuthFirstName((prev) => firstName.trim() || prev);
    setAuthLastName((prev) => lastName.trim() || prev);
    setAuthPhone((prev) => phone.trim() || prev);
    setAuthEmail((prev) => email.trim() || prev);
    setAuthCountry((prev) => countryOption.countryCode || prev);
    setAuthAddress((prev) => deliveryAddress.trim() || prev);
    setAuthError('');
    setSuggestSwitchToLogin(false);
    setAuthPassword('');
    setAuthMode(preferredMode);
    setAuthStepOpen(true);
  };

  const submitOrder = async (override?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    deliveryAddress: string;
    countryCode: string;
  }) => {
    const fName = (override?.firstName ?? firstName).trim();
    const lName = (override?.lastName ?? lastName).trim();
    const fPhone = (override?.phone ?? phone).trim();
    const fEmail = (override?.email ?? email).trim();
    const fAddress = (override?.deliveryAddress ?? deliveryAddress).trim();
    const fCountry = (override?.countryCode ?? countryOption.countryCode).trim().toUpperCase();

    if (items.length === 0) {
      setError(t('orderDrawer.errNoItems'));
      return false;
    }
    if (!fName || !lName || !fPhone || !fAddress) {
      setError(t('orderDrawer.errMissingContact'));
      return false;
    }
    if (settings.orderSettings.requireEmail && !fEmail) {
      setError(t('orderDrawer.errMissingEmail'));
      return false;
    }

    const effectiveShipping = resolveShippingFeeForCountry(fCountry, settings.orderSettings, lang);
    const effectiveGrandTotal = Math.round((productsSubtotal + effectiveShipping.fee) * 100) / 100;
    const displaySubtotal = convertClientAmount(productsSubtotal);
    const displayShipping = convertClientAmount(effectiveShipping.fee);
    const displayGrandTotal = Math.round((displaySubtotal + displayShipping) * 100) / 100;

    setSubmitting(true);
    setError('');
    try {
      const res = await publicApi.createOrder({
        firstName: fName,
        lastName: lName,
        phone: fPhone,
        email: fEmail,
        deliveryAddress: fAddress,
        message: message.trim(),
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        customerCountry: fCountry,
        ...(autoEnabled
          ? {
              displayCurrencyCode: countryOption.currencyCode,
              displayCurrencySymbol: countryOption.currencySymbol,
              displayTotal:
                fCountry === countryOption.countryCode
                  ? displayGrandTotal
                  : convertClientAmount(effectiveGrandTotal),
            }
          : {}),
      });
      persistCheckoutContact({
        firstName: fName,
        lastName: lName,
        phone: fPhone,
        email: fEmail,
        deliveryAddress: fAddress,
      });
      setConfirmedOrder(res.order);
      setAuthStepOpen(false);
      setAuthReadyBanner(false);
      onClearBasket();
      onOrderSuccess(res.order, res.visitor);
      setMessage('');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('orderDrawer.errGeneric');
      if (msg.toLowerCase().includes('connecter') || msg.toLowerCase().includes('auth-required')) {
        openAuthPrompt('login');
      } else {
        setError(msg);
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) {
      setError(t('orderDrawer.errNoItems'));
      return;
    }

    if (!visitorUser) {
      persistCheckoutContact({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        deliveryAddress: deliveryAddress.trim(),
      });
      openAuthPrompt('login');
      return;
    }

    await submitOrder();
  };

  const completeCheckoutAfterAuth = async (
    visitor: VisitorMemberPublic,
    orders: Order[],
    chosenCountry?: string,
  ) => {
    onVisitorAuthenticated(visitor, orders);

    const resolvedFirst = firstName.trim() || visitor.firstName || '';
    const resolvedLast = lastName.trim() || visitor.lastName || '';
    const resolvedPhone = phone.trim() || visitor.phone || '';
    const resolvedEmail = email.trim() || visitor.email || '';
    const resolvedAddress = deliveryAddress.trim() || visitor.address || '';
    const resolvedCountry = (chosenCountry || countryOption.countryCode || visitor.country || 'FR')
      .trim()
      .toUpperCase();

    setFirstName(resolvedFirst);
    setLastName(resolvedLast);
    setPhone(resolvedPhone);
    setEmail(resolvedEmail);
    setDeliveryAddress(resolvedAddress);
    if (resolvedCountry && resolvedCountry !== countryOption.countryCode) {
      setCountryOverride(resolvedCountry);
    }

    persistCheckoutContact({
      firstName: resolvedFirst,
      lastName: resolvedLast,
      phone: resolvedPhone,
      email: resolvedEmail,
      deliveryAddress: resolvedAddress,
    });

    const hasAllDeliveryFields =
      Boolean(resolvedFirst) &&
      Boolean(resolvedLast) &&
      Boolean(resolvedPhone) &&
      Boolean(resolvedAddress) &&
      (!settings.orderSettings.requireEmail || Boolean(resolvedEmail));

    if (hasAllDeliveryFields && items.length > 0) {
      await submitOrder({
        firstName: resolvedFirst,
        lastName: resolvedLast,
        phone: resolvedPhone,
        email: resolvedEmail,
        deliveryAddress: resolvedAddress,
        countryCode: resolvedCountry,
      });
    } else {
      setAuthStepOpen(false);
      setAuthReadyBanner(true);
      setError('');
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuggestSwitchToLogin(false);

    if (!authEmail.trim()) {
      setAuthError(t('orderDrawer.errEmailRequired'));
      return;
    }

    if (authMode === 'login') {
      setAuthLoading(true);
      try {
        const res = await visitorApi.login(authEmail.trim(), authPassword.trim());
        await completeCheckoutAfterAuth(res.visitor, res.orders);
      } catch (err) {
        if (err instanceof EmailNotVerifiedError) {
          setAuthPassword('');
          setAuthError(err.message);
        } else {
          setAuthError(err instanceof Error ? err.message : t('account.errGeneric'));
        }
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    // Register mode
    if (!authFirstName.trim() || !authLastName.trim()) {
      setAuthError(t('orderDrawer.errNamesRequired'));
      return;
    }
    if (!authCountry.trim()) {
      setAuthError(t('account.errSelectCountry'));
      return;
    }
    if (authPassword.trim().length < 6) {
      setAuthError(t('account.errPasswordLength'));
      return;
    }

    setAuthLoading(true);
    try {
      const effectivePhone = authPhone.trim() || phone.trim();
      const effectiveAddress = authAddress.trim() || deliveryAddress.trim();
      const res = await visitorApi.registerAndSignIn({
        firstName: authFirstName.trim(),
        lastName: authLastName.trim(),
        email: authEmail.trim(),
        phone: effectivePhone,
        address: effectiveAddress,
        country: authCountry.trim().toUpperCase(),
        password: authPassword.trim(),
      });
      if (effectivePhone && !phone.trim()) setPhone(effectivePhone);
      if (effectiveAddress && !deliveryAddress.trim()) setDeliveryAddress(effectiveAddress);
      await completeCheckoutAfterAuth(res.visitor, res.orders, authCountry.trim().toUpperCase());
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        setAuthPassword('');
        setAuthMode('login');
        setAuthError(err.message);
        return;
      }
      const msg = err instanceof Error ? err.message : t('account.errGeneric');
      setAuthError(msg);
      if (
        msg.toLowerCase().includes('existe déjà') ||
        msg.toLowerCase().includes('already')
      ) {
        setSuggestSwitchToLogin(true);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    setAuthError('');
    setSuggestSwitchToLogin(false);
    setAuthSocialLoading(provider);
    try {
      const res = await visitorApi.signInWithProvider(provider, 'visitor');
      if (res.role === 'visitor') {
        await completeCheckoutAfterAuth(res.visitor, res.orders);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : t('account.errSocial'));
    } finally {
      setAuthSocialLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={t('orderDrawer.ariaLabel')}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-xl bg-[#FAF9F6] h-full shadow-2xl border-l border-[#E6E4DF] flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#E6E4DF] flex items-center justify-between bg-white">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#141413]">
              {confirmedOrder
                ? t('orderDrawer.confirmedTitle')
                : authStepOpen
                  ? t('orderDrawer.authTitle')
                  : t('orderDrawer.title')}
            </h2>
            <p className="text-xs text-[#5C5A55] mt-0.5">{t('orderDrawer.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('common.close')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5C5A55] hover:bg-[#F3F2EE] hover:text-[#141413]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {confirmedOrder ? (
            <div className="bg-white border border-[#E6E4DF] rounded-xl p-6 space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#8F6B18] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-[#5C5A55] tabular-nums">
                    {t('orderDrawer.refLabel', { orderNumber: confirmedOrder.orderNumber })}
                  </p>
                  <h3 className="text-lg font-semibold text-[#141413] mt-0.5">
                    {t('orderDrawer.thankYou', { name: confirmedOrder.customerFirstName })}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-[#5C5A55] leading-relaxed">
                {settings.orderSettings.confirmationMessage}
              </p>

              <div className="border-t border-b border-[#E6E4DF] py-4 space-y-2.5">
                {confirmedOrder.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span className="text-[#141413]">
                      {item.quantity} × {item.productName}
                    </span>
                    <span className="font-mono tabular-nums text-[#5C5A55]">
                      {formatClientPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
                {typeof confirmedOrder.shippingFee === 'number' && (
                  <>
                    <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-between text-xs text-[#5C5A55]">
                      <span>{t('orderDrawer.productsSubtotal')}</span>
                      <span className="font-mono tabular-nums">
                        {formatClientPrice(
                          confirmedOrder.subtotal ??
                            Math.max(0, confirmedOrder.indicativeTotal - confirmedOrder.shippingFee),
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#5C5A55]">
                      <span>
                        {t('orderDrawer.delivery', {
                          country: getCountryDisplayName(confirmedOrder.customerCountry, lang),
                        })}
                      </span>
                      <span className="font-mono tabular-nums">
                        {confirmedOrder.shippingFee === 0
                          ? t('common.free')
                          : formatClientPrice(confirmedOrder.shippingFee)}
                      </span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-between text-sm font-semibold">
                  <span>{t('orderDrawer.grandTotal')}</span>
                  <span className="font-mono tabular-nums text-[#141413]">
                    {typeof confirmedOrder.displayTotal === 'number' &&
                    confirmedOrder.displayCurrencySymbol
                      ? formatAmountWithCurrency(
                          confirmedOrder.displayTotal,
                          confirmedOrder.displayCurrencySymbol,
                          getCurrencyOptionByCode(
                            confirmedOrder.displayCurrencyCode,
                            confirmedOrder.displayCurrencySymbol,
                          ).decimals,
                          lang,
                        )
                      : formatClientPrice(confirmedOrder.indicativeTotal)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#5C5A55] space-y-1">
                <p>
                  <strong className="text-[#141413]">{t('orderDrawer.phoneLabel')}</strong>{' '}
                  {confirmedOrder.customerPhone}
                </p>
                <p>
                  <strong className="text-[#141413]">{t('orderDrawer.deliveryLabel')}</strong>{' '}
                  {confirmedOrder.deliveryAddress}
                </p>
              </div>

              {(() => {
                const formattedConfirmedTotal =
                  typeof confirmedOrder.displayTotal === 'number' &&
                  confirmedOrder.displayCurrencySymbol
                    ? formatAmountWithCurrency(
                        confirmedOrder.displayTotal,
                        confirmedOrder.displayCurrencySymbol,
                        getCurrencyOptionByCode(
                          confirmedOrder.displayCurrencyCode,
                          confirmedOrder.displayCurrencySymbol,
                        ).decimals,
                        lang,
                      )
                    : formatClientPrice(confirmedOrder.indicativeTotal);
                const { whatsappUrl, adminOrderUrl } = buildOrderWhatsappUrl(
                  confirmedOrder,
                  settings,
                  formattedConfirmedTotal,
                  undefined,
                  lang,
                );
                return (
                  <div className="rounded-xl bg-[#FBF6EA] border border-[#8F6B18]/25 p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-[#141413]">
                        {t('orderDrawer.whatsappTitle')}
                      </p>
                      <p className="text-[11px] text-[#5C5A55] mt-0.5 leading-relaxed">
                        {t('orderDrawer.whatsappDesc')}
                      </p>
                    </div>

                    <div className="bg-white border border-[#E3E3E6] rounded-lg p-2.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#6B6860] block">
                            {t('orderDrawer.orderCode')}
                          </span>
                          <span className="font-mono font-semibold text-[#141413]">
                            {confirmedOrder.orderNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('code', confirmedOrder.orderNumber)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D9D6CF] text-[11px] font-medium text-[#141413] hover:bg-[#FAF9F6]"
                        >
                          {copiedField === 'code' ? (
                            <>
                              <Check className="w-3 h-3 text-[#8F6B18]" />
                              <span>{t('common.copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{t('common.copy')}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-[#6B6860] block">
                            {t('orderDrawer.directLink')}
                          </span>
                          <span className="font-mono text-[11px] text-[#8F6B18] block truncate">
                            {adminOrderUrl}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('link', adminOrderUrl)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D9D6CF] text-[11px] font-medium text-[#141413] hover:bg-[#FAF9F6] shrink-0"
                        >
                          {copiedField === 'link' ? (
                            <>
                              <Check className="w-3 h-3 text-[#8F6B18]" />
                              <span>{t('common.copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{t('common.copyLink')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-[#128C7E] hover:bg-[#0E7367] text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t('orderDrawer.notifyWhatsapp')}</span>
                    </a>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const ord = confirmedOrder;
                    const contact = ord.customerEmail || ord.customerPhone;
                    handleClose();
                    onNavigate(
                      `/suivi-commande?num=${encodeURIComponent(ord.orderNumber)}&contact=${encodeURIComponent(contact)}`,
                    );
                  }}
                  className="w-full py-2.5 px-4 bg-[#8F6B18] text-white text-sm font-semibold rounded-lg hover:bg-[#735613] transition-colors"
                >
                  {t('orderDrawer.trackOrderBtn')}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 bg-white border border-[#D9D6CF] text-[#141413] text-sm font-medium rounded-lg hover:bg-[#FAF9F6] transition-colors"
                >
                  {t('orderDrawer.continueVisit')}
                </button>
              </div>
            </div>
          ) : authStepOpen && !visitorUser ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthStepOpen(false);
                    setAuthError('');
                  }}
                  className="text-xs font-medium text-[#8F6B18] hover:underline"
                >
                  {t('orderDrawer.authBackToOrder')}
                </button>
                <span className="text-xs font-mono tabular-nums font-semibold text-[#141413]">
                  {t('orderDrawer.totalLabel', { total: formatClientPrice(grandTotal) })}
                </span>
              </div>

              <div className="rounded-xl bg-[#FBF6EA] border border-[#8F6B18]/25 p-4 flex items-start gap-3">
                <Lock className="w-4 h-4 text-[#8F6B18] shrink-0 mt-0.5" />
                <p className="text-xs text-[#141413] leading-relaxed">
                  {t('orderDrawer.authBanner')}
                </p>
              </div>

              <div className="bg-white border border-[#E6E4DF] rounded-xl p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#EFECE6] rounded-lg mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                      setSuggestSwitchToLogin(false);
                    }}
                    className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                      authMode === 'login'
                        ? 'bg-white text-[#141413] shadow-xs'
                        : 'text-[#5C5A55] hover:text-[#141413]'
                    }`}
                  >
                    {t('orderDrawer.authTabLogin')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError('');
                      setSuggestSwitchToLogin(false);
                    }}
                    className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                      authMode === 'register'
                        ? 'bg-white text-[#141413] shadow-xs'
                        : 'text-[#5C5A55] hover:text-[#141413]'
                    }`}
                  >
                    {t('orderDrawer.authTabRegister')}
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
                    <p>{authError}</p>
                    {suggestSwitchToLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthError('');
                          setSuggestSwitchToLogin(false);
                        }}
                        className="font-semibold text-[#8F6B18] underline"
                      >
                        {t('orderDrawer.authExistingSwitch')}
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
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
                            value={authFirstName}
                            onChange={(e) => setAuthFirstName(e.target.value)}
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
                            value={authLastName}
                            onChange={(e) => setAuthLastName(e.target.value)}
                            placeholder={t('account.lastNamePlaceholder')}
                            className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="checkout-register-country"
                          className="block text-xs font-medium text-[#3F3E3A] mb-1"
                        >
                          {t('account.country')} <span className="text-red-700">*</span>
                        </label>
                        <CountrySelect
                          id="checkout-register-country"
                          value={authCountry}
                          onChange={setAuthCountry}
                          required
                          placeholder={t('account.countryPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                          {t('account.phone')}
                        </label>
                        <input
                          type="tel"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
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
                          value={authAddress}
                          onChange={(e) => setAuthAddress(e.target.value)}
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
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
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
                        type={authShowPassword ? 'text' : 'password'}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder={
                          authMode === 'register'
                            ? t('account.passwordMinPlaceholder')
                            : '••••••••'
                        }
                        className="w-full pl-3 pr-10 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setAuthShowPassword((v) => !v)}
                        aria-label={authShowPassword ? t('account.hide') : t('account.show')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6860] hover:text-[#141413]"
                      >
                        {authShowPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || authSocialLoading !== null || submitting}
                    className="w-full py-2.5 px-4 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {authLoading || submitting
                      ? t('orderDrawer.authProcessing')
                      : authMode === 'login'
                        ? t('orderDrawer.authLoginBtn')
                        : t('orderDrawer.authRegisterBtn')}
                  </button>
                </form>

                <div className="relative my-5">
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
                    disabled={authLoading || authSocialLoading !== null || submitting}
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
                      {authSocialLoading === 'google'
                        ? t('account.googleLoading')
                        : authMode === 'register'
                          ? t('account.googleSignup')
                          : t('account.googleContinue')}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={authLoading || authSocialLoading !== null || submitting}
                    onClick={() => void handleSocialAuth('facebook')}
                    className="w-full py-2.5 px-4 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2.5"
                  >
                    <svg
                      className="w-4 h-4 shrink-0 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
                    </svg>
                    <span>
                      {authSocialLoading === 'facebook'
                        ? t('account.facebookLoading')
                        : authMode === 'register'
                          ? t('account.facebookSignup')
                          : t('account.facebookContinue')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Items */}
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="text-sm font-semibold text-[#141413]">
                    {t('orderDrawer.selectedProducts', {
                      count: items.reduce((s, i) => s + i.quantity, 0),
                    })}
                  </h3>
                  {items.length > 0 && (
                    <span className="text-sm font-mono font-semibold tabular-nums text-[#141413]">
                      {t('orderDrawer.totalLabel', { total: formatClientPrice(grandTotal) })}
                    </span>
                  )}
                </div>
                <div className="mb-3 flex items-center justify-between gap-2 bg-white border border-[#E6E4DF] rounded-lg px-3 py-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[#5C5A55]">
                    <Globe className="w-3.5 h-3.5 text-[#8F6B18]" />
                    <span>
                      {autoEnabled
                        ? t('orderDrawer.countryCurrencyLabel')
                        : t('orderDrawer.countryOnlyLabel')}
                    </span>
                  </span>
                  <select
                    aria-label={t('orderDrawer.countrySelectAria')}
                    value={countryOption.countryCode}
                    onChange={(e) => setCountryOverride(e.target.value)}
                    className="text-xs font-medium text-[#141413] bg-transparent focus:outline-none"
                  >
                    {availableCountries.map((opt) => (
                      <option key={opt.countryCode} value={opt.countryCode}>
                        {opt.countryName}
                        {autoEnabled ? ` (${opt.currencySymbol})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {items.length === 0 ? (
                  <div className="bg-white border border-[#E6E4DF] rounded-xl p-6 text-center">
                    <ShoppingBag className="w-7 h-7 mx-auto text-[#8A877E] mb-2" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-[#141413]">
                      {t('orderDrawer.emptyTitle')}
                    </p>
                    <p className="text-xs text-[#5C5A55] mt-1">{t('orderDrawer.emptyDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3.5 bg-white border border-[#E6E4DF] rounded-xl p-3"
                      >
                        <SafeImage
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#141413] truncate">
                            {product.name}
                          </p>
                          <p className="text-xs font-mono tabular-nums text-[#5C5A55] mt-0.5">
                            {formatClientPrice(product.price)} / {t('common.perUnit')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 border border-[#E6E4DF] rounded-lg px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, quantity - 1)}
                            aria-label={t('orderDrawer.decreaseQty')}
                            className="w-7 h-7 flex items-center justify-center rounded text-[#5C5A55] hover:text-[#141413]"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-medium tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, quantity + 1)}
                            aria-label={t('orderDrawer.increaseQty')}
                            className="w-7 h-7 flex items-center justify-center rounded text-[#5C5A55] hover:text-[#141413]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          aria-label={t('orderDrawer.removeProductAria', { name: product.name })}
                          className="p-2 text-[#8A877E] hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {settings.orderSettings.allowMultiProductCart && availableToAdd.length > 0 && (
                  <div className="mt-3">
                    <label htmlFor="quick-add-product" className="sr-only">
                      {t('orderDrawer.addOtherProductSr')}
                    </label>
                    <select
                      id="quick-add-product"
                      value=""
                      onChange={(e) => {
                        const prod = availableToAdd.find((p) => p.id === e.target.value);
                        if (prod) onAddProduct(prod);
                      }}
                      className="w-full text-xs bg-white border border-[#E6E4DF] rounded-lg px-3 py-2 text-[#5C5A55] focus:border-[#8F6B18] focus:outline-none"
                    >
                      <option value="">{t('orderDrawer.addOtherProductOption')}</option>
                      {availableToAdd.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatClientPrice(p.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {items.length > 0 && (
                  <div className="mt-4 bg-white border border-[#E6E4DF] rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#5C5A55]">
                      <span>{t('orderDrawer.productsSubtotal')}</span>
                      <span className="font-mono tabular-nums text-[#141413]">
                        {formatClientPrice(productsSubtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#5C5A55]">
                      <span>
                        {t('orderDrawer.delivery', { country: countryOption.countryName })}
                      </span>
                      <span className="font-mono tabular-nums text-[#141413]">
                        {shippingInfo.fee === 0
                          ? t('common.free')
                          : formatClientPrice(shippingInfo.fee)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#EFECE6] flex items-center justify-between text-sm font-semibold text-[#141413]">
                      <span>{t('orderDrawer.grandTotal')}</span>
                      <span className="font-mono tabular-nums">
                        {formatClientPrice(grandTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Request Form */}
              <form
                id="order-request-form"
                noValidate={!visitorUser}
                onSubmit={handleSubmit}
                className="space-y-4 pt-4 border-t border-[#E6E4DF]"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#141413]">
                    {t('orderDrawer.yourDetails')}
                  </h3>
                  {visitorUser ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8F6B18]">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>
                        {t('orderDrawer.authSignedInAs', {
                          name: `${visitorUser.firstName} ${visitorUser.lastName}`.trim(),
                        })}
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAuthPrompt('login')}
                      className="text-[11px] text-[#5C5A55] hover:text-[#8F6B18]"
                    >
                      {t('orderDrawer.alreadyHaveAccount')}{' '}
                      <span className="font-semibold underline text-[#8F6B18]">
                        {t('orderDrawer.signInShortcut')}
                      </span>
                    </button>
                  )}
                </div>

                {authReadyBanner && visitorUser && (
                  <div className="p-3 rounded-lg bg-[#FBF6EA] border border-[#8F6B18]/25 text-xs text-[#8F6B18] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{t('orderDrawer.authReadyBanner')}</span>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      {t('orderDrawer.firstName')} <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t('orderDrawer.firstNamePlaceholder')}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      {t('orderDrawer.lastName')} <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('orderDrawer.lastNamePlaceholder')}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      {t('orderDrawer.phone')} <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('account.phonePlaceholder')}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      {t('orderDrawer.email')}{' '}
                      {settings.orderSettings.requireEmail ? (
                        <span className="text-red-700">*</span>
                      ) : (
                        `(${t('common.optional')})`
                      )}
                    </label>
                    <input
                      type="email"
                      required={settings.orderSettings.requireEmail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('account.emailPlaceholder')}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                    {t('orderDrawer.deliveryAddress')} <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={t('orderDrawer.deliveryAddressPlaceholder')}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#6B6860] mt-1">
                    {t('orderDrawer.servedZones', { zones: settings.orderSettings.deliveryZones })}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                    {t('orderDrawer.messageOptional')}
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('orderDrawer.messagePlaceholder')}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:outline-none resize-none"
                  />
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sticky Footer Submit */}
        {!confirmedOrder && !authStepOpen && (
          <div className="px-6 py-4 border-t border-[#E6E4DF] bg-white">
            <button
              type="submit"
              form="order-request-form"
              disabled={submitting || items.length === 0}
              className="w-full py-3 px-4 bg-[#8F6B18] text-white text-sm font-semibold rounded-lg hover:bg-[#735613] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? t('orderDrawer.submitting') : t('orderDrawer.submit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
