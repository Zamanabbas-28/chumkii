import { motion } from 'framer-motion'

const steps = [
  {
    n: '01',
    title: 'Share Your Idea',
    text: 'Choose a design or tell us what you have in mind.',
  },
  {
    n: '02',
    title: 'Pick Your Colours & Details',
    text: "We'll use your preferences as inspiration for your piece.",
  },
  {
    n: '03',
    title: 'Choose Your Size',
    text: 'Make sure your Chumki feels comfortable and fits just right.',
  },
  {
    n: '04',
    title: "We'll Create It With Care",
    text: 'Your customized bangles are prepared with attention to every little detail.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-ivory px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-gold">
          Gentle process
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          How Custom Orders Work
        </h2>
        <p className="mt-3 max-w-xl text-sm text-ink-soft sm:text-base">
          From idea to handmade stack — simple, personal, and unhurried.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="rounded-2xl border border-border-soft bg-cream/50 p-5"
            >
              <span className="font-display text-3xl text-gold">{step.n}</span>
              <h3 className="mt-3 font-display text-xl text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-border-soft bg-cream/60 px-5 py-6 sm:px-8">
          <h3 className="font-display text-2xl text-ink">Delivery across Bangladesh</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            We deliver nationwide. Within Sylhet, orders usually take about{' '}
            <span className="font-semibold text-ink">6–7 days</span>. Outside
            Sylhet, about{' '}
            <span className="font-semibold text-ink">10–12 days</span>. Timelines
            begin after your order is confirmed.
          </p>
        </div>
      </div>
    </section>
  )
}
