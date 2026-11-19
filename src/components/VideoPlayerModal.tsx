import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { VideoItem } from '../types/cms';

interface VideoPlayerModalProps {
  video: VideoItem | null;
  onClose: () => void;
}

export function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const { t } = useLanguage();
  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-4xl bg-[#141413] text-white rounded-xl overflow-hidden shadow-2xl border border-white/10">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <h3 className="text-sm sm:text-base font-medium pr-4 truncate">{video.title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('videoModal.closeAria')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
        {video.description && (
          <div className="px-5 py-4 text-xs sm:text-sm text-stone-300 leading-relaxed">
            {video.description}
          </div>
        )}
      </div>
    </div>
  );
}
