import CustomBangleBuilder from './CustomBangleBuilder'

export default function CustomizationSection() {
  return (
    <section id="customize" className="bg-cream/70 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-gold">
          Make it yours
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl md:text-5xl">
          Create Your Own Chumki ✨
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
          Choose shape, size type, colours, style, and decorative silver threading —
          then add your custom bangle to the cart.
        </p>

        <div className="mt-10 rounded-3xl border border-border-soft bg-ivory p-5 shadow-sm sm:p-8">
          <CustomBangleBuilder />
        </div>
      </div>
    </section>
  )
}
