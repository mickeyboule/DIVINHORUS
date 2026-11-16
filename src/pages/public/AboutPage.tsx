import { SafeImage } from '../../components/SafeImage';
import type { PublicBootstrapData } from '../../types/cms';

interface AboutPageProps {
  data: PublicBootstrapData;
  onNavigate: (path: string) => void;
}

export function AboutPage({ data, onNavigate }: AboutPageProps) {
  const { aboutPage, master } = data.siteContent;

  return (
    <div className="bg-[#FAF9F6]">
      {/* Intro Hero */}
      <section className="py-16 sm:py-24 border-b border-[#E6E4DF] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-xs font-medium text-[#2A4036] tracking-wide">
                À propos · {master.name}
              </p>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold text-[#141413] leading-[1.12] tracking-tight">
                {aboutPage.heroTitle}
              </h1>
              <p className="mt-5 text-base sm:text-lg text-[#5C5A55] leading-relaxed">
                {aboutPage.heroSubtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/boutique')}
                  className="px-5 py-2.5 bg-[#2A4036] text-white text-sm font-semibold rounded-lg hover:bg-[#20322A] transition-colors"
                >
                  Découvrir les créations
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="px-5 py-2.5 bg-white border border-[#D9D6CF] text-[#141413] text-sm font-semibold rounded-lg hover:border-[#141413] transition-colors"
                >
                  Prendre contact
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[3/4] lg:aspect-auto lg:h-full min-h-[380px] rounded-xl overflow-hidden bg-[#F3F2EE]">
                <SafeImage
                  src={aboutPage.image || master.photo}
                  alt={master.name}
                  fallbackLabel={master.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy & Atelier */}
      <section className="py-16 sm:py-24 border-b border-[#E6E4DF]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-semibold text-[#141413]">
              {aboutPage.philosophyTitle}
            </h2>
            <div className="mt-4 space-y-4 text-base text-[#3F3E3A] leading-relaxed whitespace-pre-line">
              {aboutPage.philosophyBody}
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl font-semibold text-[#141413]">
              {aboutPage.lineageTitle}
            </h2>
            <div className="mt-4 space-y-4 text-base text-[#3F3E3A] leading-relaxed whitespace-pre-line">
              {aboutPage.lineageBody}
            </div>
          </div>
        </div>
      </section>

      {/* Commitments */}
      {aboutPage.commitments.length > 0 && (
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
            <h2 className="font-display text-3xl font-semibold text-[#141413] mb-10">
              Nos engagements essentiels
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {aboutPage.commitments.map((item, idx) => (
                <div key={idx} className="p-6 bg-[#FAF9F6] border border-[#E6E4DF] rounded-xl">
                  <p className="text-xs font-mono text-[#6B6860] mb-2">0{idx + 1}.</p>
                  <h3 className="text-lg font-semibold text-[#141413]">{item.title}</h3>
                  <p className="mt-2.5 text-sm text-[#5C5A55] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
