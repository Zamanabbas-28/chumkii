import { Link } from 'react-router-dom'

export default function SizeSelector({ sizes, value, onChange }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Select your size</p>
        <Link
          to="/#size-guide"
          className="text-xs font-medium text-dusty-rose underline-offset-2 hover:underline"
        >
          Not sure about your size? View Size Guide
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {(sizes || []).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`min-h-11 min-w-14 rounded-full border px-3 text-sm font-medium transition ${
              value === s
                ? 'border-ink bg-ink text-ivory'
                : 'border-border-soft bg-cream text-ink hover:border-gold'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
