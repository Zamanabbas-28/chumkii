import DmCustomizationCta from './DmCustomizationCta'

export default function CustomizationSection() {
  return (
    <section id="customize" className="bg-cream/50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <DmCustomizationCta
          title="Looking for something a little different? ✨"
          description="For fully customized bangles, bespoke colorways, special threading, or unique stack sizes, send us a DM and we'll help you create something special."
        />
      </div>
    </section>
  )
}
