import { getLoginUrl } from "../api";

export function Login() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[500px] text-center px-4 w-full">
      {/* Background Halftone & Compass Atmosphere */}
      <div className="absolute inset-0 bg-halftone opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-compass opacity-30 pointer-events-none animate-compass" />

      {/* Floating Soul Particles */}
      <div className="soul-particle" />
      <div className="soul-particle" />
      <div className="soul-particle" />
      <div className="soul-particle" />

      <main className="threshold-stage flex flex-col items-center justify-center gap-9 max-w-xl relative z-10">
        {/* Summoning Circle Frame (220px diameter) */}
        <div className="summoning-circle-frame w-56 h-56 rounded-full flex flex-col items-center justify-center p-4 relative animate-flicker glow-ember border border-[#70F8C1]/40">
          <div className="summoning-circle-inner-ring absolute inset-3 rounded-full border border-dashed border-[#70F8C1]/30 pointer-events-none" />
          <div className="summoning-circle-outer-ring absolute -inset-1.5 rounded-full border border-[#FFEFD7]/12 pointer-events-none" />
          <h1 className="brand-wordmark-large text-speckle font-serif text-2xl tracking-[0.25em] text-[#FFEFD7]">
            STORABOGA SOUND
          </h1>
        </div>

        {/* Description Copy */}
        <p className="welcome-text font-serif text-sm tracking-wider text-[#FFEFD7]/90 max-w-md">
          A Discord music bot for small private servers.
        </p>

        {/* Login with Discord Link Button */}
        <a
          href={getLoginUrl()}
          className="tactile-btn btn-primary-highlight text-base px-10 py-3.5 tracking-widest label-glyph flex items-center gap-3"
        >
          <span className="text-speckle">LOGIN WITH DISCORD</span>
        </a>
      </main>

      {/* Letterpress Footer */}
      <footer className="threshold-footer text-speckle absolute bottom-8 text-xs tracking-[0.35em] opacity-65 text-[#FFEFD7]">
        STORABOGA SOUND
      </footer>
    </div>
  );
}

export default Login;
