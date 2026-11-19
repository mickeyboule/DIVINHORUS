import { ArrowRight, ExternalLink, Info, Megaphone, Sun, X } from 'lucide-react';
import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { WelcomeAnnouncement } from '../types/cms';
import { SafeImage } from './SafeImage';

interface WelcomeAnnouncementModalProps {
  open: boolean;
  announcement: WelcomeAnnouncement | undefined;
  siteName: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function WelcomeAnnouncementModal({
  open,
  announcement,
  siteName,
  onClose,
  onNavigate,
}: WelcomeAnnouncementModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !announcement) return null;

  const defaultKicker =
    announcement.type === 'welcome'
      ? t('announcement.kickerWelcome')
      : announcement.type === 'info'
        ? t('announcement.kickerInfo')
        : announcement.type === 'important'
          ? t('announcement.kickerImportant')
          : t('announcement.kickerDefault');

  const kickerText = announcement.kicker?.trim() || defaultKicker;
  const hasButton = Boolean(announcement.buttonLabel?.trim() && announcement.buttonTarget?.trim());
  const isExternalTarget = Boolean(
    announcement.buttonTarget && /^https?:\/\//i.test(announcement.buttonTarget.trim()),
  );

  const handleActionClick = () => {
    const target = announcement.buttonTarget?.trim() || '/';
    onClose();
    if (/^https?:\/\//i.test(target)) {
      window.location.href = target;
      return;
    }
    onNavigate(target.startsWith('/') ? target : `/${target}`);
  };

  const TypeIcon =
    announcement.type === 'important' ? Megaphone : announcement.type === 'info' ? Info : Sun;

  const kickerColor =
    announcement.type === 'important' ? 'text-[#8C3B2B]' : 'text-[#2A4036]';
  const ctaButtonClass =
    announcement.type === 'important'
      ? 'bg-[#141413] hover:bg-[#2A2A28] text-white'
      : 'bg-[#2A4036] hover:bg-[#20322A] text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-announcement-title"
    >
      <div
        className="fixed inset-0 bg-[#141413]/55 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-xl bg-[#FAF9F6] border border-[#E6E4DF] rounded-2xl shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('announcement.closeAria')}
          className="absolute top-3.5 right-3.5 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white border border-[#E6E4DF] flex items-center justify-center text-[#3F3E3A] hover:text-[#141413] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {announcement.image?.trim() && (
          <div className="w-full aspect-[16/9] bg-[#EFECE6] overflow-hidden border-b border-[#E6E4DF]">
            <SafeImage
              src={announcement.image}
              alt={announcement.title || siteName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-5">
          <div className="space-y-2.5 pr-8">
            <div className={`inline-flex items-center gap-2 text-xs font-medium tracking-wide ${kickerColor}`}>
              <TypeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{kickerText}</span>
              <span aria-hidden="true" className="text-[#B8B4AA]">
                ·
              </span>
              <span className="text-[#6B6860] font-normal">{siteName}</span>
            </div>

            {announcement.title && (
              <h2
                id="welcome-announcement-title"
                className="font-display text-2xl sm:text-3xl font-semibold text-[#141413] leading-tight text-balance"
              >
                {announcement.title}
              </h2>
            )}
          </div>

          {announcement.message && (
            <div className="text-sm sm:text-[15px] leading-relaxed text-[#4A4843] whitespace-pre-line max-h-[45vh] overflow-y-auto pr-1">
              {announcement.message}
            </div>
          )}

          <div className="pt-4 border-t border-[#E6E4DF] flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs font-medium text-[#5C5A55] hover:text-[#141413] bg-white border border-[#D9D6CF] hover:border-[#141413] rounded-lg transition-colors whitespace-nowrap"
            >
              {t('announcement.continueVisit')}
            </button>

            {hasButton && (
              <button
                type="button"
                onClick={handleActionClick}
                className={`min-h-[40px] px-5 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap ${ctaButtonClass}`}
              >
                <span>{announcement.buttonLabel}</span>
                {isExternalTarget ? (
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
