import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { useState } from 'react';
import type { SiteSettings, VisitorMemberPublic } from '../types/cms';

export type PublicRoute =
  | '/'
  | '/boutique'
  | '/communaute'
  | '/a-propos'
  | '/contact'
  | '/mon-compte'
  | '/suivi-commande'
  | string;

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  basketCount: number;
  onOpenOrderDrawer: () => void;
  settings: SiteSettings;
  visitorUser: VisitorMemberPublic | null;
}

const NAV_ITEMS = [
  { label: 'Accueil', path: '/' },
  { label: 'Boutique', path: '/boutique' },
  { label: 'Communauté', path: '/communaute' },
  { label: 'À propos', path: '/a-propos' },
  { label: 'Contact', path: '/contact' },
];

export function Header({
  currentPath,
  onNavigate,
  basketCount,
  onOpenOrderDrawer,
  settings,
  visitorUser,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const handleNav = (path: string) => {
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E6E4DF]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Title */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:rounded"
        >
          {settings.general.logoUrl ? (
            <img
              src={settings.general.logoUrl}
              alt={settings.general.siteName}
              className="h-7 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <span className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#141413]">
            {settings.general.siteName}
          </span>
        </button>

        {/* Zone 2: 5 concise single-line text links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
                  active ? 'text-[#141413]' : 'text-[#5C5A55] hover:text-[#141413]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#2A4036]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Visitor Account, Basket Icon & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('/mon-compte')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              currentPath.startsWith('/mon-compte')
                ? 'bg-[#EFECE6] border-[#D4D0C8] text-[#141413]'
                : 'bg-white border-[#E6E4DF] text-[#3F3E3A] hover:border-[#2A4036] hover:text-[#141413]'
            }`}
          >
            <User className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{visitorUser ? visitorUser.firstName : 'Connexion'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenOrderDrawer}
            aria-label={`Ouvrir ma demande de commande (${basketCount} article${basketCount > 1 ? 's' : ''})`}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#141413] hover:bg-[#EFECE6] transition-colors"
          >
            <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.75} />
            {basketCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#2A4036] text-white text-[10px] font-semibold tabular-nums flex items-center justify-center leading-none">
                {basketCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNav('/boutique')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-wide text-white bg-[#2A4036] rounded-lg hover:bg-[#20322A] transition-colors whitespace-nowrap shrink-0"
          >
            Commander
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#141413] hover:bg-[#EFECE6] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E6E4DF] bg-[#FAF9F6] px-4 py-4">
          <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-[#EFECE6] text-[#141413]' : 'text-[#5C5A55] hover:bg-[#F2F0EC]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleNav('/suivi-commande')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/suivi-commande')
                  ? 'bg-[#EFECE6] text-[#141413]'
                  : 'text-[#5C5A55] hover:bg-[#F2F0EC]'
              }`}
            >
              Suivre ma commande
            </button>
            <button
              type="button"
              onClick={() => handleNav('/mon-compte')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/mon-compte')
                  ? 'bg-[#EFECE6] text-[#141413]'
                  : 'text-[#5C5A55] hover:bg-[#F2F0EC]'
              }`}
            >
              {visitorUser ? `Mon compte (${visitorUser.firstName})` : 'Connexion / Mon compte'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenOrderDrawer();
              }}
              className="mt-2 w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#2A4036] rounded-lg hover:bg-[#20322A] transition-colors"
            >
              Ma demande de commande ({basketCount})
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
