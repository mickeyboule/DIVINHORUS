import { MailCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface EmailVerificationScreenProps {
  email: string;
  onGoToLogin: () => void;
}

export function EmailVerificationScreen({ email, onGoToLogin }: EmailVerificationScreenProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-white border border-[#E6E4DF] rounded-xl p-6 sm:p-8 shadow-xs text-center space-y-5">
      <div className="w-12 h-12 rounded-full bg-[#8F6B18]/10 text-[#8F6B18] flex items-center justify-center mx-auto">
        <MailCheck className="w-6 h-6" strokeWidth={1.75} />
      </div>

      <div className="space-y-2.5">
        <h2 className="font-display text-2xl font-semibold text-[#141413]">
          {t('emailVerify.title')}
        </h2>
        <p className="text-sm text-[#3F3E3A] leading-relaxed">
          {t('emailVerify.bodyPrefix')}{' '}
          <strong className="font-semibold text-[#141413] break-all">{email}</strong>.{' '}
          {t('emailVerify.bodySuffix')}
        </p>
      </div>

      <button
        type="button"
        onClick={onGoToLogin}
        className="w-full py-2.5 px-4 bg-[#8F6B18] hover:bg-[#735613] text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {t('emailVerify.goToLogin')}
      </button>
    </div>
  );
}
