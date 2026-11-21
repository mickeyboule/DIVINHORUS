interface LoadingSplashProps {
  message: string;
  siteName?: string;
}

export function LoadingSplash({ message, siteName = 'DIVIN HORUS' }: LoadingSplashProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6 py-12 text-center select-none"
    >
      <div className="relative flex items-center justify-center mb-6">
        <div
          aria-hidden="true"
          className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-radial from-[#E5B84B]/20 via-[#E5B84B]/5 to-transparent blur-md dh-horus-halo"
        />
        <img
          src="/assets/aistudio/_il_d_Horus_dor___clatant_439f7d48.png"
          alt={siteName}
          className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain mix-blend-multiply dh-horus-breathe"
          draggable={false}
        />
      </div>

      <p className="font-display text-2xl sm:text-3xl font-semibold tracking-wide text-[#141413]">
        {siteName}
      </p>

      <div
        aria-hidden="true"
        className="mt-4 w-40 h-[2px] rounded-full bg-[#E5D3A1]/50 overflow-hidden"
      >
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#8F6B18]/40 via-[#C99B2E] to-[#8F6B18]/40 dh-gold-shimmer" />
      </div>

      <p className="mt-3 text-xs sm:text-sm text-[#6B6860] tracking-wide">{message}</p>
    </div>
  );
}
