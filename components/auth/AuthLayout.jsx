import AuthBrandPanel from './AuthBrandPanel';

/**
 * Page shell: soft green background, centred card with a controlled max
 * width; brand panel + form side by side from lg, form only below. No fixed
 * heights — the page scrolls naturally on short / landscape screens and with
 * the virtual keyboard open. Safe-area insets pad the edges on notched phones.
 */
export default function AuthLayout({ children }) {
  return (
    <div
      className="auth-page min-h-dvh bg-brand-hero flex justify-center lg:items-center overflow-x-clip"
    >
      <div
        className="auth-rise w-full max-w-[560px] lg:max-w-[1180px] self-start lg:self-auto
          grid lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]
          bg-white rounded-[24px] lg:rounded-[28px] overflow-hidden
          border border-[#e3ebdd] shadow-[0_24px_60px_-30px_rgba(22,51,0,0.35)]"
      >
        <AuthBrandPanel />
        {children}
      </div>
    </div>
  );
}
