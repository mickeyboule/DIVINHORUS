import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { publicApi } from '../../lib/api';
import type { PublicBootstrapData } from '../../types/cms';

interface ContactPageProps {
  data: PublicBootstrapData;
}

export function ContactPage({ data }: ContactPageProps) {
  const { t } = useLanguage();
  const { contactPage } = data.siteContent;
  const { contact } = data.settings;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await publicApi.sendContact({ name, email, phone, subject, message });
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contact.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#FAF9F6] py-12 sm:py-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#8F6B18] tracking-wide">
            {t('contact.kicker')}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#141413] tracking-tight">
            {contactPage.title}
          </h1>
          <p className="mt-4 text-base text-[#5C5A55] leading-relaxed">{contactPage.subtitle}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#E6E4DF] rounded-xl p-6 space-y-5">
              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#8F6B18] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-[#141413]">
                    {t('contact.addressTitle')}
                  </h2>
                  <p className="text-sm text-[#5C5A55] mt-1">
                    {contact.address}
                    <br />
                    {contact.city}, {contact.country}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-4 border-t border-[#F0EFEA]">
                <Phone className="w-5 h-5 text-[#8F6B18] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-[#141413]">
                    {t('contact.phoneTitle')}
                  </h2>
                  <p className="text-sm text-[#5C5A55] mt-1">{contact.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-4 border-t border-[#F0EFEA]">
                <Mail className="w-5 h-5 text-[#8F6B18] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-[#141413]">
                    {t('contact.emailTitle')}
                  </h2>
                  <p className="text-sm text-[#5C5A55] mt-1">{contact.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F3F2EE] border border-[#E6E4DF] rounded-xl p-6 space-y-3 text-sm text-[#3F3E3A]">
              <p className="font-medium text-[#141413]">{contactPage.sanctuaryHours}</p>
              <p className="text-[#5C5A55] leading-relaxed">{contactPage.consultationNote}</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white border border-[#E6E4DF] rounded-xl p-6 sm:p-8">
            {sent ? (
              <div className="py-8 text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-[#8F6B18] mx-auto" />
                <h2 className="font-display text-3xl font-semibold text-[#141413]">
                  {t('contact.sentTitle')}
                </h2>
                <p className="text-sm text-[#5C5A55] max-w-md mx-auto leading-relaxed">
                  {t('contact.sentDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="px-5 py-2.5 bg-[#8F6B18] text-white text-xs font-semibold rounded-lg"
                >
                  {t('contact.sendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[#141413] mb-2">
                  {t('contact.formTitle')}
                </h2>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      {t('contact.fullName')} <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('contact.fullNamePlaceholder')}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      {t('contact.email')} <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('contact.emailPlaceholder')}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      {t('contact.phoneOptional')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('contact.phonePlaceholder')}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                      {t('contact.subject')}
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t('contact.subjectPlaceholder')}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5A55] mb-1">
                    {t('contact.message')} <span className="text-red-700">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('contact.messagePlaceholder')}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D9D6CF] rounded-lg focus:border-[#8F6B18] focus:bg-white focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-3 bg-[#8F6B18] hover:bg-[#735613] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {sending ? t('contact.sending') : t('contact.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
