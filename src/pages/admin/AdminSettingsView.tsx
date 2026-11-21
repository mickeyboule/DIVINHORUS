import { Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { SafeImage } from '../../components/SafeImage';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { SignatureEditor } from '../../components/admin/SignatureEditor';
import { adminApi } from '../../lib/api';
import { COUNTRY_CURRENCY_LIST, SUPPORTED_CURRENCIES } from '../../lib/currency';
import { formatDateTimeFr } from '../../lib/format';
import type { AdminUserPublic, MediaItem, Product, SiteSettings } from '../../types/cms';

interface AdminSettingsViewProps {
  settings: SiteSettings;
  admins: AdminUserPublic[];
  currentAdmin: AdminUserPublic;
  media: MediaItem[];
  onSettingsChanged: (settings: SiteSettings, updatedProducts?: Product[]) => void;
  onAdminsChanged: (admins: AdminUserPublic[]) => void;
  onCurrentAdminUpdated?: (admin: AdminUserPublic) => void;
  onMediaAdded: (item: MediaItem) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function AdminSettingsView({
  settings,
  admins,
  currentAdmin,
  media,
  onSettingsChanged,
  onAdminsChanged,
  onCurrentAdminUpdated,
  onMediaAdded,
  onNotify,
}: AdminSettingsViewProps) {
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [tab, setTab] = useState<'general' | 'contact' | 'orders' | 'admins'>('general');
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'logo' | 'favicon' | null>(null);

  useEffect(() => {
    if (!isDirty) {
      setDraft(settings);
    }
  }, [settings, isDirty]);

  const updateDraft = (updater: SiteSettings | ((prev: SiteSettings) => SiteSettings)) => {
    setIsDirty(true);
    setDraft(updater);
  };

  const normalizeExternalUrl = (raw: string): string => {
    const val = raw.trim();
    if (!val) return '';
    if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(val)) return val;
    return `https://${val}`;
  };

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'Super Administrateur' | 'Éditeur'>('Éditeur');
  const [deleteAdminTarget, setDeleteAdminTarget] = useState<AdminUserPublic | null>(null);

  const [ownName, setOwnName] = useState(currentAdmin.name);
  const [ownEmail, setOwnEmail] = useState(currentAdmin.email);
  const [savingOwnProfile, setSavingOwnProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [convertCatalogPrices, setConvertCatalogPrices] = useState(true);

  const existingShippingCodes = new Set(
    (draft.orderSettings.shippingRatesByCountry || []).map((r) => r.countryCode.toUpperCase()),
  );
  const availableShippingCountries = COUNTRY_CURRENCY_LIST.filter(
    (c) => !existingShippingCodes.has(c.countryCode.toUpperCase()),
  );
  const [newShipCountry, setNewShipCountry] = useState('GB');
  const [newShipFee, setNewShipFee] = useState('15');

  const savedCurrencyCode = (settings.general.currencyCode || 'EUR').toUpperCase();
  const draftCurrencyCode = (draft.general.currencyCode || 'EUR').toUpperCase();
  const currencyChanged =
    draftCurrencyCode !== savedCurrencyCode &&
    savedCurrencyCode !== 'CUSTOM' &&
    draftCurrencyCode !== 'CUSTOM';

  const persistSettings = async (
    nextSettings: SiteSettings,
    customSuccessMessage?: string,
    shouldConvertCatalog = false,
  ) => {
    setSaving(true);
    try {
      const normalizedPayload: SiteSettings = {
        ...nextSettings,
        socials: {
          youtube: normalizeExternalUrl(nextSettings.socials.youtube),
          tiktok: normalizeExternalUrl(nextSettings.socials.tiktok),
          facebook: normalizeExternalUrl(nextSettings.socials.facebook),
          telegram: normalizeExternalUrl(nextSettings.socials.telegram),
        },
      };
      const res = await adminApi.updateSettings(normalizedPayload, {
        convertCatalogPrices: shouldConvertCatalog,
      });
      setDraft(res.settings);
      setIsDirty(false);
      onSettingsChanged(res.settings, res.products);
      onNotify(
        'success',
        customSuccessMessage ||
          (res.products
            ? `Paramètres enregistrés et ${res.products.length} prix convertis en ${res.settings.general.currencySymbol}.`
            : 'Paramètres enregistrés.'),
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    await persistSettings(draft, undefined, currencyChanged && convertCatalogPrices);
  };

  const handleCreateAdmin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.createAdmin({
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        role: newAdminRole,
      });
      onAdminsChanged([...admins, res.admin]);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      onNotify('success', `Administrateur ${res.admin.email} créé.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur création.');
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteAdminTarget) return;
    try {
      await adminApi.deleteAdmin(deleteAdminTarget.id);
      onAdminsChanged(admins.filter((a) => a.id !== deleteAdminTarget.id));
      onNotify('success', 'Compte administrateur supprimé.');
      setDeleteAdminTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleChangeOwnPassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.changePassword(newPassword);
      setNewPassword('');
      onNotify('success', 'Votre mot de passe a été modifié.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleUpdateOwnProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingOwnProfile(true);
    try {
      const res = await adminApi.updateOwnAdminProfile({
        email: ownEmail.trim(),
        name: ownName.trim(),
      });
      onCurrentAdminUpdated?.(res.admin);
      onAdminsChanged(admins.map((a) => (a.id === res.admin.id ? res.admin : a)));
      onNotify(
        'success',
        `Votre adresse de connexion est désormais : ${res.admin.email}`,
      );
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Impossible de modifier l’adresse de connexion.',
      );
    } finally {
      setSavingOwnProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Paramètres du site</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Identité générale, coordonnées, réseaux sociaux, règles de commande et accès administrateurs.
          </p>
        </div>
        {tab !== 'admins' && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {isDirty && (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                Modifications non enregistrées
              </span>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void persistSettings(draft, undefined, currencyChanged && convertCatalogPrices)
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'general', label: 'Informations générales' },
          { id: 'contact', label: 'Coordonnées & Réseaux' },
          { id: 'orders', label: 'Paramètres de commande' },
          { id: 'admins', label: 'Administrateurs & Sécurité' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg ${
              tab === t.id
                ? 'bg-[#141413] text-white'
                : 'bg-white border border-[#E3E3E6] text-[#5C5A55]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'admins' ? (
        <form onSubmit={handleSaveSettings} className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-5 text-xs">
          {tab === 'general' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Nom du site</label>
                  <input
                    type="text"
                    value={draft.general.siteName}
                    onChange={(e) =>
                      updateDraft({ ...draft, general: { ...draft.general, siteName: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Slogan / Descriptif</label>
                  <input
                    type="text"
                    value={draft.general.tagline}
                    onChange={(e) =>
                      updateDraft({ ...draft, general: { ...draft.general, tagline: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-[#3F3E3A] mb-1">
                    Devise principale de la boutique
                  </label>
                  <select
                    value={
                      SUPPORTED_CURRENCIES.some((c) => c.code === draftCurrencyCode)
                        ? draftCurrencyCode
                        : 'CUSTOM'
                    }
                    onChange={(e) => {
                      const code = e.target.value;
                      if (code === 'CUSTOM') {
                        updateDraft({
                          ...draft,
                          general: { ...draft.general, currencyCode: 'CUSTOM' },
                        });
                        return;
                      }
                      const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
                      if (found) {
                        updateDraft({
                          ...draft,
                          general: {
                            ...draft.general,
                            currencyCode: found.code,
                            currencySymbol: found.symbol,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label} — {c.symbol}
                      </option>
                    ))}
                    <option value="CUSTOM">Autre devise personnalisée</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">
                    Symbole affiché
                  </label>
                  <input
                    type="text"
                    value={draft.general.currencySymbol}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        general: { ...draft.general, currencySymbol: e.target.value },
                      })
                    }
                    placeholder="€, FCFA, $ US..."
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              {currencyChanged && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FFF8EB] border border-[#F2D59B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertCatalogPrices}
                    onChange={(e) => setConvertCatalogPrices(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-semibold text-[#141413]">
                      Convertir automatiquement les prix actuels du catalogue ({savedCurrencyCode} → {draftCurrencyCode})
                    </span>
                    <span className="block text-[11px] text-[#5C5A55] mt-0.5">
                      Met à jour les tarifs existants de vos produits selon le taux de change vers {draft.general.currencySymbol}. Décochez si vous souhaitez saisir vos nouveaux montants manuellement.
                    </span>
                  </span>
                </label>
              )}

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FAF9F6] border border-[#E3E3E6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.general.autoCurrencyByCountry !== false}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      general: { ...draft.general, autoCurrencyByCountry: e.target.checked },
                    })
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-semibold text-[#141413]">
                    Ajuster automatiquement la devise selon le pays du client
                  </span>
                  <span className="block text-[11px] text-[#5C5A55] mt-0.5">
                    Les prix saisis dans votre devise principale ({draft.general.currencySymbol}) sont convertis automatiquement selon le pays détecté du visiteur (FCFA, €, $ CA, CHF, $ US, MAD, £, etc.) avec possibilité de choix manuel en boutique.
                  </span>
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="block font-medium text-[#3F3E3A]">Logo (URL ou média)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draft.general.logoUrl}
                      onChange={(e) =>
                        updateDraft({
                          ...draft,
                          general: { ...draft.general, logoUrl: e.target.value },
                        })
                      }
                      placeholder="Optionnel (texte utilisé sinon)"
                      className="flex-1 px-3 py-2 text-xs border border-[#D9D6CF] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerTarget('logo')}
                      className="px-3 py-2 bg-[#F6F6F7] border border-[#D9D6CF] rounded-lg font-semibold hover:bg-[#ECEAE4]"
                    >
                      Média
                    </button>
                  </div>
                  {draft.general.logoUrl ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg">
                      <SafeImage
                        src={draft.general.logoUrl}
                        alt="Aperçu du logo"
                        className="h-12 w-auto max-w-[160px] object-contain rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextDraft = {
                            ...draft,
                            general: { ...draft.general, logoUrl: '' },
                          };
                          updateDraft(nextDraft);
                          void persistSettings(nextDraft, 'Logo retiré et enregistré.');
                        }}
                        className="text-[11px] font-semibold text-red-700 hover:underline px-2 py-1"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#8A877E]">
                      Aucun logo sélectionné (le nom du site s’affiche en typographie).
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <label className="block font-medium text-[#3F3E3A]">Favicon (URL ou média)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draft.general.faviconUrl}
                      onChange={(e) =>
                        updateDraft({
                          ...draft,
                          general: { ...draft.general, faviconUrl: e.target.value },
                        })
                      }
                      placeholder="Optionnel"
                      className="flex-1 px-3 py-2 text-xs border border-[#D9D6CF] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerTarget('favicon')}
                      className="px-3 py-2 bg-[#F6F6F7] border border-[#D9D6CF] rounded-lg font-semibold hover:bg-[#ECEAE4]"
                    >
                      Média
                    </button>
                  </div>
                  {draft.general.faviconUrl ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 bg-[#FAF9F6] border border-[#E3E3E6] rounded-lg">
                      <SafeImage
                        src={draft.general.faviconUrl}
                        alt="Aperçu du favicon"
                        className="h-10 w-10 object-contain rounded border border-[#E3E3E6] bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextDraft = {
                            ...draft,
                            general: { ...draft.general, faviconUrl: '' },
                          };
                          updateDraft(nextDraft);
                          void persistSettings(nextDraft, 'Favicon retiré et enregistré.');
                        }}
                        className="text-[11px] font-semibold text-red-700 hover:underline px-2 py-1"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#8A877E]">
                      Icône d’onglet du navigateur (optionnel).
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'contact' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Email de contact</label>
                  <input
                    type="email"
                    value={draft.contact.email}
                    onChange={(e) =>
                      updateDraft({ ...draft, contact: { ...draft.contact, email: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={draft.contact.phone}
                    onChange={(e) =>
                      updateDraft({ ...draft, contact: { ...draft.contact, phone: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Adresse</label>
                  <input
                    type="text"
                    value={draft.contact.address}
                    onChange={(e) =>
                      updateDraft({ ...draft, contact: { ...draft.contact, address: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Ville / Code postal</label>
                  <input
                    type="text"
                    value={draft.contact.city}
                    onChange={(e) =>
                      updateDraft({ ...draft, contact: { ...draft.contact, city: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Pays</label>
                  <input
                    type="text"
                    value={draft.contact.country}
                    onChange={(e) =>
                      updateDraft({ ...draft, contact: { ...draft.contact, country: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EFEA] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Lien YouTube</label>
                  <input
                    type="text"
                    value={draft.socials.youtube}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        socials: { ...draft.socials, youtube: e.target.value },
                      })
                    }
                    placeholder="https://www.youtube.com/@..."
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Lien TikTok</label>
                  <input
                    type="text"
                    value={draft.socials.tiktok}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        socials: { ...draft.socials, tiktok: e.target.value },
                      })
                    }
                    placeholder="https://www.tiktok.com/@..."
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Lien Facebook</label>
                  <input
                    type="text"
                    value={draft.socials.facebook}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        socials: { ...draft.socials, facebook: e.target.value },
                      })
                    }
                    placeholder="https://www.facebook.com/..."
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Lien Telegram</label>
                  <input
                    type="text"
                    value={draft.socials.telegram}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        socials: { ...draft.socials, telegram: e.target.value },
                      })
                    }
                    placeholder="https://t.me/..."
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>
            </>
          )}

          {tab === 'orders' && (
            <>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">
                  Message affiché après confirmation d’une demande
                </label>
                <textarea
                  rows={3}
                  value={draft.orderSettings.confirmationMessage}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      orderSettings: {
                        ...draft.orderSettings,
                        confirmationMessage: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Zones de livraison</label>
                <input
                  type="text"
                  value={draft.orderSettings.deliveryZones}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      orderSettings: { ...draft.orderSettings, deliveryZones: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">
                  Numéro WhatsApp de l’équipe (alertes commandes)
                </label>
                <input
                  type="tel"
                  value={draft.orderSettings.teamWhatsappPhone || ''}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      orderSettings: { ...draft.orderSettings, teamWhatsappPhone: e.target.value },
                    })
                  }
                  placeholder={draft.contact.phone || '+33 6 00 00 00 00'}
                  className="w-full px-3 py-2 text-sm font-mono border border-[#D9D6CF] rounded-lg"
                />
                <p className="text-[11px] text-[#6B6860] mt-1">
                  Numéro utilisé par le bouton « Avertir l’équipe sur WhatsApp » après chaque commande (indicatif pays inclus, ex : +225...). Si vide, le numéro de téléphone principal de l’onglet Coordonnées sera utilisé.
                </p>
              </div>

              {/* Frais de livraison par pays */}
              <div className="pt-4 border-t border-[#F0EFEA] space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#141413]">
                    Frais de livraison selon le pays du client
                  </h3>
                  <p className="text-[11px] text-[#5C5A55] mt-0.5">
                    Définissez le prix de livraison en {draft.general.currencySymbol}. Ce montant est ajouté automatiquement au prix des produits pour calculer la somme totale affichée au client.
                  </p>
                </div>

                <div className="max-w-xs">
                  <label className="block font-medium text-[#3F3E3A] mb-1">
                    Tarif par défaut — autres pays ({draft.general.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={draft.orderSettings.defaultShippingFee ?? 0}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        orderSettings: {
                          ...draft.orderSettings,
                          defaultShippingFee: Math.max(0, Number(e.target.value) || 0),
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-[#D9D6CF] rounded-lg"
                  />
                  <p className="text-[11px] text-[#8A877E] mt-1">
                    Mettez 0 pour une livraison offerte par défaut.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-[#3F3E3A]">Tarifs spécifiques par pays</p>
                  {(draft.orderSettings.shippingRatesByCountry || []).length === 0 ? (
                    <p className="text-xs text-[#6B6860] italic">
                      Aucun tarif spécifique configuré. Le tarif par défaut s’appliquera à tous les pays.
                    </p>
                  ) : (
                    <div className="border border-[#E3E3E6] rounded-lg divide-y divide-[#F0EFEA]">
                      {(draft.orderSettings.shippingRatesByCountry || []).map((rule) => (
                        <div
                          key={rule.countryCode}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-[#141413]">{rule.countryName}</span>
                            <span className="ml-2 text-[11px] font-mono text-[#8A877E]">
                              ({rule.countryCode})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              aria-label={`Frais de livraison pour ${rule.countryName}`}
                              value={rule.fee}
                              onChange={(e) => {
                                const fee = Math.max(0, Number(e.target.value) || 0);
                                updateDraft({
                                  ...draft,
                                  orderSettings: {
                                    ...draft.orderSettings,
                                    shippingRatesByCountry: (
                                      draft.orderSettings.shippingRatesByCountry || []
                                    ).map((item) =>
                                      item.countryCode === rule.countryCode
                                        ? { ...item, fee }
                                        : item,
                                    ),
                                  },
                                });
                              }}
                              className="w-28 px-2.5 py-1.5 text-xs font-mono tabular-nums text-right border border-[#D9D6CF] rounded-md"
                            />
                            <span className="text-xs text-[#5C5A55] w-10">
                              {draft.general.currencySymbol}
                            </span>
                            <button
                              type="button"
                              aria-label={`Supprimer le tarif pour ${rule.countryName}`}
                              onClick={() =>
                                updateDraft({
                                  ...draft,
                                  orderSettings: {
                                    ...draft.orderSettings,
                                    shippingRatesByCountry: (
                                      draft.orderSettings.shippingRatesByCountry || []
                                    ).filter((item) => item.countryCode !== rule.countryCode),
                                  },
                                })
                              }
                              className="p-1.5 rounded-md text-[#6B6860] hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {availableShippingCountries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <select
                        value={
                          availableShippingCountries.some((c) => c.countryCode === newShipCountry)
                            ? newShipCountry
                            : availableShippingCountries[0].countryCode
                        }
                        onChange={(e) => setNewShipCountry(e.target.value)}
                        className="px-3 py-2 text-xs bg-white border border-[#D9D6CF] rounded-lg"
                      >
                        {availableShippingCountries.map((c) => (
                          <option key={c.countryCode} value={c.countryCode}>
                            {c.countryName} ({c.countryCode})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={newShipFee}
                        onChange={(e) => setNewShipFee(e.target.value)}
                        placeholder={`Prix (${draft.general.currencySymbol})`}
                        className="w-28 px-3 py-2 text-xs font-mono tabular-nums border border-[#D9D6CF] rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const targetCode = availableShippingCountries.some(
                            (c) => c.countryCode === newShipCountry,
                          )
                            ? newShipCountry
                            : availableShippingCountries[0].countryCode;
                          const country = availableShippingCountries.find(
                            (c) => c.countryCode === targetCode,
                          );
                          if (!country) return;
                          const fee = Math.max(0, Number(newShipFee) || 0);
                          const updatedList = [
                            ...(draft.orderSettings.shippingRatesByCountry || []),
                            {
                              countryCode: country.countryCode,
                              countryName: country.countryName,
                              fee,
                            },
                          ];
                          updateDraft({
                            ...draft,
                            orderSettings: {
                              ...draft.orderSettings,
                              shippingRatesByCountry: updatedList,
                            },
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F6F6F7] hover:bg-[#EAEAE8] border border-[#D9D6CF] text-[#141413] text-xs font-semibold rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter ce pays</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.orderSettings.requireEmail}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        orderSettings: {
                          ...draft.orderSettings,
                          requireEmail: e.target.checked,
                        },
                      })
                    }
                  />
                  <span className="font-medium text-[#141413]">
                    Rendre l’adresse email obligatoire dans le formulaire de commande
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.orderSettings.allowMultiProductCart}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        orderSettings: {
                          ...draft.orderSettings,
                          allowMultiProductCart: e.target.checked,
                        },
                      })
                    }
                  />
                  <span className="font-medium text-[#141413]">
                    Autoriser l’ajout de plusieurs produits dans une même demande
                  </span>
                </label>
              </div>

              {/* Modèle par défaut de facture, moyen de paiement et signature */}
              <div className="pt-4 border-t border-[#F0EFEA] space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#141413]">
                    Facturation, moyen de paiement &amp; signature par défaut
                  </h3>
                  <p className="text-[11px] text-[#5C5A55] mt-0.5">
                    Ces informations pré-remplissent vos nouvelles factures lors de leur création après confirmation d’une commande. Vous pourrez toujours les modifier facture par facture.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-[#3F3E3A] mb-1">
                      Moyen de paiement par défaut
                    </label>
                    <input
                      type="text"
                      value={draft.orderSettings.defaultPaymentMethod || ''}
                      onChange={(e) =>
                        updateDraft({
                          ...draft,
                          orderSettings: {
                            ...draft.orderSettings,
                            defaultPaymentMethod: e.target.value,
                          },
                        })
                      }
                      placeholder="Ex : Mobile Money / Virement bancaire"
                      className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#3F3E3A] mb-1">
                      Mention de bas de facture
                    </label>
                    <input
                      type="text"
                      value={draft.orderSettings.defaultInvoiceNotes || ''}
                      onChange={(e) =>
                        updateDraft({
                          ...draft,
                          orderSettings: {
                            ...draft.orderSettings,
                            defaultInvoiceNotes: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">
                    Coordonnées / Instructions de paiement par défaut
                  </label>
                  <textarea
                    rows={3}
                    value={draft.orderSettings.defaultPaymentDetails || ''}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        orderSettings: {
                          ...draft.orderSettings,
                          defaultPaymentDetails: e.target.value,
                        },
                      })
                    }
                    placeholder="IBAN, numéro Wave / Orange Money, instructions de règlement..."
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>

                <SignatureEditor
                  value={
                    draft.orderSettings.defaultInvoiceSignature || {
                      type: 'text',
                      imageUrl: '',
                      signerName: draft.general.siteName,
                      signerRole: 'Direction · Service Commandes',
                    }
                  }
                  media={media}
                  onMediaAdded={onMediaAdded}
                  onChange={(sig) =>
                    updateDraft({
                      ...draft,
                      orderSettings: {
                        ...draft.orderSettings,
                        defaultInvoiceSignature: sig,
                      },
                    })
                  }
                />
              </div>
            </>
          )}

          <div className="pt-4 border-t border-[#F0EFEA] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8F6B18] hover:bg-[#735613] text-white text-xs font-semibold rounded-lg"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Admin Accounts List */}
          <div className="lg:col-span-7 bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#141413]">Comptes administrateurs</h3>
            <div className="divide-y divide-[#F0EFEA]">
              {admins.map((adm) => (
                <div key={adm.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#141413]">
                      {adm.name} {adm.id === currentAdmin.id ? '(Vous)' : ''}
                    </p>
                    <p className="text-[#5C5A55]">
                      {adm.email} · {adm.role}
                    </p>
                    {adm.lastLoginAt && (
                      <p className="text-[11px] font-mono text-[#8A877E] tabular-nums">
                        Dernière connexion : {formatDateTimeFr(adm.lastLoginAt)}
                      </p>
                    )}
                  </div>
                  {adm.id !== currentAdmin.id && (
                    <button
                      type="button"
                      onClick={() => setDeleteAdminTarget(adm)}
                      className="p-1.5 rounded-lg text-[#5C5A55] hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateAdmin} className="pt-4 border-t border-[#E3E3E6] space-y-3">
              <p className="font-semibold text-[#141413]">Ajouter un administrateur</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Nom complet"
                  className="px-3 py-2 border border-[#D9D6CF] rounded-lg"
                />
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Email"
                  className="px-3 py-2 border border-[#D9D6CF] rounded-lg"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Mot de passe (6+ car.)"
                  className="px-3 py-2 border border-[#D9D6CF] rounded-lg"
                />
                <select
                  value={newAdminRole}
                  onChange={(e) =>
                    setNewAdminRole(e.target.value as 'Super Administrateur' | 'Éditeur')
                  }
                  className="px-3 py-2 border border-[#D9D6CF] rounded-lg"
                >
                  <option value="Éditeur">Éditeur</option>
                  <option value="Super Administrateur">Super Administrateur</option>
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8F6B18] text-white font-semibold rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer l’accès</span>
              </button>
            </form>
          </div>

          {/* Own Login Email & Password */}
          <div className="lg:col-span-5 space-y-6 self-start">
            <form
              onSubmit={handleUpdateOwnProfile}
              className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-[#141413]">
                  Votre adresse de connexion
                </h3>
                <p className="text-[11px] text-[#5C5A55] mt-0.5">
                  Utilisez cette nouvelle adresse email lors de vos prochaines connexions.
                </p>
              </div>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Nom affiché</label>
                <input
                  type="text"
                  required
                  value={ownName}
                  onChange={(e) => setOwnName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">
                  Adresse email de connexion
                </label>
                <input
                  type="email"
                  required
                  value={ownEmail}
                  onChange={(e) => setOwnEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={savingOwnProfile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white font-semibold rounded-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingOwnProfile ? 'Enregistrement...' : 'Mettre à jour l’adresse'}
                </span>
              </button>
            </form>

            <form
              onSubmit={handleChangeOwnPassword}
              className="bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4"
            >
              <h3 className="text-sm font-semibold text-[#141413]">Sécurité de votre compte</h3>
              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">
                  Nouveau mot de passe (6 caractères minimum)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#141413] text-white font-semibold rounded-lg"
              >
                Mettre à jour le mot de passe
              </button>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        media={media}
        defaultFolder="site"
        onMediaAdded={onMediaAdded}
        onSelect={(url) => {
          const target = pickerTarget;
          setPickerTarget(null);
          if (!target) return;
          let nextDraft: SiteSettings = draft;
          let msg = 'Paramètre enregistré.';
          if (target === 'logo') {
            nextDraft = { ...draft, general: { ...draft.general, logoUrl: url } };
            msg = 'Logo enregistré et affiché sur le site.';
          } else if (target === 'favicon') {
            nextDraft = { ...draft, general: { ...draft.general, faviconUrl: url } };
            msg = 'Favicon enregistré et appliqué.';
          }
          setDraft(nextDraft);
          void persistSettings(nextDraft, msg);
        }}
        onClose={() => setPickerTarget(null)}
      />

      <ConfirmModal
        open={Boolean(deleteAdminTarget)}
        title="Supprimer ce compte administrateur ?"
        description={`L’accès de « ${deleteAdminTarget?.email} » sera révoqué immédiatement.`}
        confirmLabel="Supprimer"
        onConfirm={handleDeleteAdmin}
        onCancel={() => setDeleteAdminTarget(null)}
      />
    </div>
  );
}
