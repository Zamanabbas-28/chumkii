export default function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-cream px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div
        className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-soft-lavender/50 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-blush/30 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-gold">
          Our story
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl md:text-5xl">
          A Little Sparkle, A Personal Touch
        </h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-soft sm:text-base">
          <p>
            Chumki is inspired by the idea that the smallest details can make
            something feel truly yours. A favourite colour, a stone that catches
            the light, or a combination created especially for an outfit —
            every choice adds a little personality.
          </p>
          <p>
            We love creating bangles that don&apos;t simply match an outfit, but
            feel like a small part of your story. Handmade with care in Sylhet,
            Bangladesh — each stack is crafted to feel personal, colourful, and
            quietly special.
          </p>
        </div>
      </div>
    </section>
  )
}
