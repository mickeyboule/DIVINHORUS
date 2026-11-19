import { Star, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { publicApi } from '../lib/api';
import type { Testimonial, VisitorMemberPublic } from '../types/cms';

interface TestimonialModalProps {
  open: boolean;
  onClose: () => void;
  visitorUser: VisitorMemberPublic | null;
  onCreated: (testimonial: Testimonial) => void;
}

export function TestimonialModal({
  open,
  onClose,
  visitorUser,
  onCreated,
}: TestimonialModalProps) {
  const { t } = useLanguage();
  const [authorName, setAuthorName] = useState('');
  const [authorLocation, setAuthorLocation] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && visitorUser) {
      setAuthorName((prev) => prev || `${visitorUser.firstName} ${visitorUser.lastName}`.trim());
    }
  }, [open, visitorUser]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!authorName.trim() || content.trim().length < 10) {
      setError(t('testimonialModal.errValidation'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await publicApi.createTestimonial({
        authorName: authorName.trim(),
        authorLocation: authorLocation.trim(),
        rating,
        content: content.trim(),
      });
      onCreated(res.testimonial);
      setContent('');
      setAuthorLocation('');
      setRating(5);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('testimonialModal.errGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('testimonialModal.ariaLabel')}
    >
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-[#E6E4DF] flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#141413]">
              {t('testimonialModal.title')}
            </h2>
            <p className="text-xs text-[#5C5A55] mt-0.5">{t('testimonialModal.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C5A55] hover:bg-[#F3F2EE]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">
                {t('testimonialModal.yourName')} <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={t('testimonialModal.yourNamePlaceholder')}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-[#3F3E3A] mb-1">
                {t('testimonialModal.locationOrProduct')}
              </label>
              <input
                type="text"
                value={authorLocation}
                onChange={(e) => setAuthorLocation(e.target.value)}
                placeholder={t('testimonialModal.locationPlaceholder')}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1.5">
              {t('testimonialModal.ratingLabel')}
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={
                    star > 1
                      ? t('testimonialModal.starAriaPlural', { count: star })
                      : t('testimonialModal.starAriaSingle', { count: star })
                  }
                  className="p-1 rounded hover:bg-[#EFECE6] transition-colors"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= rating ? 'fill-[#8A6D3B] text-[#8A6D3B]' : 'text-[#D4D0C8]'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-mono tabular-nums text-[#5C5A55]">
                {rating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#3F3E3A] mb-1">
              {t('testimonialModal.yourTestimonial')} <span className="text-red-700">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('testimonialModal.testimonialPlaceholder')}
              className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CF] rounded-lg focus:border-[#2A4036] focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D9D6CF] bg-white rounded-lg font-medium text-[#3F3E3A]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#2A4036] hover:bg-[#20322A] disabled:opacity-50 text-white rounded-lg font-semibold"
            >
              {submitting ? t('testimonialModal.submitting') : t('testimonialModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
