import { Plus, Save, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { adminApi } from '../../lib/api';
import { formatDateTimeFr } from '../../lib/format';
import type { AdminUserPublic, MediaItem, SiteSettings } from '../../types/cms';

interface AdminSettingsViewProps {
  settings: SiteSettings;
  admins: AdminUserPublic[];
  currentAdmin: AdminUserPublic;
  media: MediaItem[];
  onSettingsChanged: (settings: SiteSettings) => void;
  onAdminsChanged: (admins: AdminUserPublic[]) => void;
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
  onMediaAdded,
  onNotify,
}: AdminSettingsViewProps) {
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [tab, setTab] = useState<'general' | 'contact' | 'orders' | 'admins'>('general');
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'logo' | 'favicon' | null>(null);

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'Super Administrateur' | 'Éditeur'>('Éditeur');
  const [deleteAdminTarget, setDeleteAdminTarget] = useState<AdminUserPublic | null>(null);

  const [newPassword, setNewPassword] = useState('');

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.updateSettings(draft);
      onSettingsChanged(res.settings);
      onNotify('success', 'Paramètres enregistrés.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Erreur sauvegarde.');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141413]">Paramètres du site</h2>
          <p className="text-xs text-[#5C5A55] mt-0.5">
            Identité générale, coordonnées, réseaux sociaux, règles de commande et accès administrateurs.
          </p>
        </div>
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
                      setDraft({ ...draft, general: { ...draft.general, siteName: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Symbole devise</label>
                  <input
                    type="text"
                    value={draft.general.currencySymbol}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        general: { ...draft.general, currencySymbol: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#3F3E3A] mb-1">Slogan / Descriptif</label>
                <input
                  type="text"
                  value={draft.general.tagline}
                  onChange={(e) =>
                    setDraft({ ...draft, general: { ...draft.general, tagline: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Logo (URL ou média)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draft.general.logoUrl}
                      onChange={(e) =>
                        setDraft({ ...draft, general: { ...draft.general, logoUrl: e.target.value } })
                      }
                      placeholder="Optionnel (texte utilisé sinon)"
                      className="flex-1 px-3 py-2 text-xs border border-[#D9D6CF] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerTarget('logo')}
                      className="px-3 py-2 bg-[#F6F6F7] border border-[#D9D6CF] rounded-lg font-semibold"
                    >
                      Média
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Favicon (URL ou média)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draft.general.faviconUrl}
                      onChange={(e) =>
                        setDraft({
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
                      className="px-3 py-2 bg-[#F6F6F7] border border-[#D9D6CF] rounded-lg font-semibold"
                    >
                      Média
                    </button>
                  </div>
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
                      setDraft({ ...draft, contact: { ...draft.contact, email: e.target.value } })
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
                      setDraft({ ...draft, contact: { ...draft.contact, phone: e.target.value } })
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
                      setDraft({ ...draft, contact: { ...draft.contact, address: e.target.value } })
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
                      setDraft({ ...draft, contact: { ...draft.contact, city: e.target.value } })
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
                      setDraft({ ...draft, contact: { ...draft.contact, country: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EFEA] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Lien YouTube</label>
                  <input
                    type="url"
                    value={draft.socials.youtube}
                    onChange={(e) =>
                      setDraft({ ...draft, socials: { ...draft.socials, youtube: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Lien Instagram</label>
                  <input
                    type="url"
                    value={draft.socials.instagram}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        socials: { ...draft.socials, instagram: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Lien Facebook</label>
                  <input
                    type="url"
                    value={draft.socials.facebook}
                    onChange={(e) =>
                      setDraft({ ...draft, socials: { ...draft.socials, facebook: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#3F3E3A] mb-1">Lien Telegram</label>
                  <input
                    type="url"
                    value={draft.socials.telegram}
                    onChange={(e) =>
                      setDraft({ ...draft, socials: { ...draft.socials, telegram: e.target.value } })
                    }
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
                    setDraft({
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
                    setDraft({
                      ...draft,
                      orderSettings: { ...draft.orderSettings, deliveryZones: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D9D6CF] rounded-lg"
                />
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.orderSettings.requireEmail}
                    onChange={(e) =>
                      setDraft({
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
                      setDraft({
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
            </>
          )}

          <div className="pt-4 border-t border-[#F0EFEA] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2A4036] hover:bg-[#20322A] text-white text-xs font-semibold rounded-lg"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A4036] text-white font-semibold rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer l’accès</span>
              </button>
            </form>
          </div>

          {/* Change own password */}
          <form
            onSubmit={handleChangeOwnPassword}
            className="lg:col-span-5 bg-white border border-[#E3E3E6] rounded-xl p-6 space-y-4 self-start"
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
      )}

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        media={media}
        defaultFolder="site"
        onMediaAdded={onMediaAdded}
        onSelect={(url) => {
          if (pickerTarget === 'logo') {
            setDraft({ ...draft, general: { ...draft.general, logoUrl: url } });
          } else if (pickerTarget === 'favicon') {
            setDraft({ ...draft, general: { ...draft.general, faviconUrl: url } });
          }
          setPickerTarget(null);
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
