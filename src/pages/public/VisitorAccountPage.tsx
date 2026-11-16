import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  LogOut,
  Package,
  Save,
  User,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SafeImage } from '../../components/SafeImage';
import { visitorApi } from '../../lib/api';
import { formatDateFr, formatDateTimeFr, formatPrice } from '../../lib/format';
import type {
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
  onProfileUpdated,
  onLogout,
  onNavigate,
  onNotify,
}: VisitorAccountPageProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Login / Register state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Logged-in workspace tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'likes' | 'profile'>('orders');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    visitorOrders[0]?.id || null,
  );

  // Profile editing state
  const [profFirst, setProfFirst] = useState(visitorUser?.firstName || '');
  const [profLast, setProfLast] = useState(visitorUser?.lastName || '');
  const [profPhone, setProfPhone] = useState(visitorUser?.phone || '');
  const [profAddress, setProfAddress] = useState(visitorUser?.address || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      if (authMode === 'login') {
        const res = await visitorApi.login(email.trim(), password.trim());
        setProfFirst(res.visitor.firstName);
        setProfLast(res.visitor.lastName);
        setProfPhone(res.visitor.phone);
        setProfAddress(res.visitor.address);
        onAuthSuccess(res.visitor, res.orders);
        onNotify('success', `Bienvenue, ${res.visitor.firstName}.`);
      } else {
        if (password.trim().length < 6) {
          setAuthError('Le mot de passe doit contenir au moins 6 caractères.');
          setLoading(false);
          return;
        }
        const res = await visitorApi.register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          password: password.trim(),
        });
        setProfFirst(res.visitor.firstName);
        setProfLast(res.visitor.lastName);
        setProfPhone(res.visitor.phone);
        setProfAddress(res.visitor.address);
        onAuthSuccess(res.visitor, res.orders);
        onNotify('success', 'Votre espace visiteur a bien été créé.');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
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
        address: profAddress,
      });
      onProfileUpdated(res.visitor, res.orders);
      onNotify('success', 'Vos coordonnées ont été mises à jour.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!visitorUser) {
    return (
      <div className="bg-[#FAF9F6] min-h-[75vh] py-12 sm:py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-medium text-[#2A4036] tracking-wide">
              Espace Visiteur
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-[#141413]">
              {authMode === 'login' ? 'Se connecter' : 'Créer votre compte'}
            </h1>
            <p className="mt-2 text-sm text-[#5C5A55]">
              Suivez l’avancement de vos commandes, retrouvez vos articles aimés et simplifiez vos prochaines demandes.
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
                Connexion
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
                Créer un compte
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
                        Prénom <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Claire"
                        className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                        Nom <span className="text-red-700">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Morel"
                        className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                      Téléphone (recommandé pour relier vos commandes)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                      Adresse habituelle (facultatif)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="14 Rue des Archives, 75004 Paris"
                      className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                  Adresse email <span className="text-red-700">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="claire.morel@exemple.fr"
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3F3E3A] mb-1">
                  Mot de passe <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authMode === 'register' ? '6 caractères minimum' : '••••••••'}
                    className="w-full pl-3 pr-10 py-2 text-sm border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6860] hover:text-[#141413]"
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
                {loading
                  ? 'Chargement...'
                  : authMode === 'login'
                    ? 'Accéder à mon espace'
                    : 'Créer mon espace visiteur'}
              </button>
            </form>

            {authMode === 'login' && (
              <div className="mt-5 pt-4 border-t border-[#EFECE6] text-xs text-[#5C5A55] space-y-2">
                <p className="font-medium text-[#141413]">Compte visiteur de démonstration :</p>
                <p className="font-mono text-[11px]">
                  claire.morel@exemple.fr / Visiteur2026
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('claire.morel@exemple.fr');
                    setPassword('Visiteur2026');
                    setAuthError('');
                  }}
                  className="text-xs font-semibold text-[#2A4036] hover:underline"
                >
                  Pré-remplir les identifiants de démonstration
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/suivi-commande')}
              className="text-xs font-medium text-[#5C5A55] hover:text-[#141413] underline"
            >
              Suivre une commande sans compte avec son numéro
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
            <p className="text-xs font-medium text-[#2A4036] tracking-wide">Espace Visiteur</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#141413]">
              Bonjour, {visitorUser.firstName} {visitorUser.lastName}
            </h1>
            <p className="mt-1 text-sm text-[#5C5A55]">{visitorUser.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/suivi-commande')}
              className="px-4 py-2 text-xs font-medium bg-white border border-[#D9D6CF] rounded-lg hover:border-[#141413] transition-colors"
            >
              Rechercher une autre commande
            </button>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#5C5A55] hover:text-red-700 bg-white border border-[#D9D6CF] rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
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
                ? 'bg-[#2A4036] text-white'
                : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="tabular-nums">Mes commandes ({visitorOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('likes')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'likes'
                ? 'bg-[#2A4036] text-white'
                : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span className="tabular-nums">Articles aimés ({likedArticles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setProfFirst(visitorUser.firstName);
              setProfLast(visitorUser.lastName);
              setProfPhone(visitorUser.phone);
              setProfAddress(visitorUser.address);
              setActiveTab('profile');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#2A4036] text-white'
                : 'bg-white border border-[#E6E4DF] text-[#5C5A55] hover:text-[#141413]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Mes coordonnées</span>
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="mt-6 space-y-4">
            {visitorOrders.length === 0 ? (
              <div className="bg-white border border-[#E6E4DF] rounded-xl p-10 text-center">
                <Package className="w-7 h-7 mx-auto text-[#8A877E] mb-2" />
                <p className="text-sm font-medium text-[#141413]">
                  Aucune commande associée à ce compte pour le moment.
                </p>
                <p className="mt-1 text-xs text-[#5C5A55]">
                  Vos futures demandes effectuées avec votre email ou téléphone apparaîtront ici automatiquement.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/boutique')}
                  className="mt-5 px-5 py-2.5 bg-[#2A4036] text-white text-xs font-semibold rounded-lg"
                >
                  Découvrir la boutique
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
                          #{ord.orderNumber} · {formatDateFr(ord.createdAt)}
                        </p>
                        <p className="text-sm font-semibold text-[#141413] mt-0.5">
                          {ord.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-mono tabular-nums font-semibold text-[#141413]">
                          {formatPrice(ord.indicativeTotal, settings.general.currencySymbol)}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#EFECE6] text-[#2A4036]">
                          {ord.status}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 py-5 border-t border-[#EFECE6] bg-[#FAF9F6] grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div>
                          <p className="font-semibold text-[#141413] mb-2">Détail des objets</p>
                          <div className="space-y-2">
                            {ord.items.map((item) => (
                              <div key={item.productId} className="flex items-center justify-between">
                                <span className="text-[#3F3E3A]">
                                  {item.quantity} × {item.productName}
                                </span>
                                <span className="font-mono tabular-nums text-[#141413]">
                                  {formatPrice(
                                    item.unitPrice * item.quantity,
                                    settings.general.currencySymbol,
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="mt-3 pt-3 border-t border-[#E6E4DF] text-[#5C5A55]">
                            <strong className="text-[#141413]">Livraison :</strong> {ord.deliveryAddress}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-[#141413] mb-2">Suivi des étapes</p>
                          <div className="space-y-2.5">
                            {ord.history.map((h, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#2A4036] shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-[#141413]">
                                    {h.status}{' '}
                                    <span className="font-normal font-mono tabular-nums text-[#6B6860]">
                                      · {formatDateTimeFr(h.date)}
                                    </span>
                                  </p>
                                  <p className="text-[#5C5A55]">{h.note}</p>
                                </div>
                              </div>
                            ))}
                          </div>
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
                  Vous n’avez pas encore enregistré d’article favori.
                </p>
                <p className="mt-1 text-xs text-[#5C5A55]">
                  Cliquez sur le cœur sur n’importe quel enseignement dans la Communauté pour le retrouver ici.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/communaute')}
                  className="mt-5 px-5 py-2.5 bg-[#2A4036] text-white text-xs font-semibold rounded-lg"
                >
                  Explorer la communauté
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
                        <p className="text-[11px] text-[#6B6860]">{formatDateFr(art.publishedAt)}</p>
                        <h3 className="mt-1 font-display text-xl font-semibold text-[#141413]">
                          {art.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/communaute/${art.slug}`)}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A4036] hover:underline"
                      >
                        <span>Relire l’enseignement</span>
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
              Mes coordonnées de livraison et de contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Prénom</label>
                <input
                  type="text"
                  required
                  value={profFirst}
                  onChange={(e) => setProfFirst(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Nom</label>
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
              <label className="block font-medium text-[#3F3E3A] mb-1">Téléphone</label>
              <input
                type="tel"
                value={profPhone}
                onChange={(e) => setProfPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">Adresse habituelle</label>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2A4036] hover:bg-[#20322A] disabled:opacity-50 text-white font-semibold rounded-lg"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Enregistrement...' : 'Enregistrer mes coordonnées'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
