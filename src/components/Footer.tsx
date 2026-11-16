import { Lock } from 'lucide-react';
import type { SiteSettings } from '../types/cms';

interface FooterProps {
  onNavigate: (path: string) => void;
  settings: SiteSettings;
}

export function Footer({ onNavigate, settings }: FooterProps) {
  const socials = [
    { label: 'YouTube', url: settings.socials.youtube },
    { label: 'Instagram', url: settings.socials.instagram },
    { label: 'Facebook', url: settings.socials.facebook },
    { label: 'Telegram', url: settings.socials.telegram },
  ].filter((s) => s.url && s.url.trim().length > 0);

  return (
    <footer className="border-t border-[#E6E4DF] bg-[#F3F2EE] text-[#141413]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <p className="font-display text-2xl font-semibold tracking-tight">
              {settings.general.siteName}
            </p>
            <p className="mt-3 text-sm text-[#5C5A55] leading-relaxed max-w-md">
              {settings.general.tagline}. Un espace dédié à la transmission contemplative, au partage communautaire et à la préparation attentive d’objets rituels.
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold tracking-wide text-[#5C5A55] mb-3">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="text-[#141413] hover:text-[#2A4036] transition-colors"
                >
                  Accueil
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/boutique')}
                  className="text-[#141413] hover:text-[#2A4036] transition-colors"
                >
                  Boutique
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/communaute')}
                  className="text-[#141413] hover:text-[#2A4036] transition-colors"
                >
                  Communauté
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/a-propos')}
                  className="text-[#141413] hover:text-[#2A4036] transition-colors"
                >
                  À propos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="text-[#141413] hover:text-[#2A4036] transition-colors"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/suivi-commande')}
                  className="text-[#141413] hover:text-[#2A4036] transition-colors"
                >
                  Suivre ma commande
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/mon-compte')}
                  className="text-[#141413] hover:text-[#2A4036] transition-colors"
                >
                  Mon compte visiteur
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold tracking-wide text-[#5C5A55] mb-3">
              Sanctuaire &amp; Coordonnées
            </h3>
            <div className="space-y-1.5 text-sm text-[#5C5A55]">
              <p className="text-[#141413] font-medium">{settings.contact.address}</p>
              <p>
                {settings.contact.city}, {settings.contact.country}
              </p>
              <p className="pt-1">{settings.contact.phone}</p>
              <p>{settings.contact.email}</p>
            </div>
            {socials.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-[#2A4036]">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#E2DFD9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#6B6860]">
          <p>
            © {new Date().getFullYear()} {settings.general.siteName}. Tous droits réservés.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/admin')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D9D6CF] text-[#141413] font-medium hover:border-[#2A4036] hover:text-[#2A4036] transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Espace Administrateur</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
