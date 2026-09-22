import StatsGraphic from './StatsGraphic';

/**
 * Shared split-screen shell for every auth page (login, reset password, ...).
 *
 * The old page stretched `w-full h-screen` directly against the viewport,
 * so on anything wider than a laptop screen the two halves spread apart
 * and everything (heading, inputs, the "Or" divider) blew up in scale.
 * Here the whole card is capped at `max-w-[1100px]` and centered in the
 * viewport with `items-center justify-center`, so it keeps its intended
 * proportions no matter how wide the browser window is.
 */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen w-full bg-[#111216] font-sans flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[1100px] flex flex-col md:flex-row gap-6 md:h-[640px]">

        {/* Left Column: Form Area */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-2 md:pl-10">
          <div className="w-full max-w-[380px] mx-auto md:mx-0">
            <h1 className="text-3xl text-white font-semibold tracking-wide mb-1">
              {title}
            </h1>
            <p className="text-[#8c8f9b] text-lg mb-10">
              {subtitle}
            </p>

            {children}
          </div>
        </div>

        <StatsGraphic />

      </div>
    </div>
  );
}
