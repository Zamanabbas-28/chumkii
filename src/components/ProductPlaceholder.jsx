/** Decorative bangle placeholder — swap for real photos later via product.image */
export default function ProductPlaceholder({
  colors = ['#c4a574', '#d4a5a5'],
  name = 'Bangle',
  className = '',
}) {
  const primary = colors[0] || '#c4a574'
  const secondary = colors[1] || colors[0] || '#d4a5a5'
  const tertiary = colors[2] || secondary

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-cream via-ivory to-soft-lavender/50 ${className}`}
      role="img"
      aria-label={`${name} — photo coming soon`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, ${primary}33, transparent 45%), radial-gradient(circle at 70% 80%, ${secondary}44, transparent 40%)`,
        }}
      />

      <svg
        viewBox="0 0 200 200"
        className="relative z-[1] h-[72%] w-[72%] drop-shadow-md"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ring-${name.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} />
            <stop offset="55%" stopColor={secondary} />
            <stop offset="100%" stopColor={tertiary} />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke={`url(#ring-${name.replace(/\s/g, '')})`}
          strokeWidth="22"
        />
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.25"
          strokeWidth="3"
          strokeDasharray="6 14"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const a = ((deg - 90) * Math.PI) / 180
          const x = 100 + 62 * Math.cos(a)
          const y = 100 + 62 * Math.sin(a)
          return (
            <circle
              key={deg}
              cx={x}
              cy={y}
              r="3.5"
              fill={deg % 90 === 0 ? tertiary : '#f5f2eb'}
              stroke={primary}
              strokeWidth="0.8"
            />
          )
        })}
        <circle cx="100" cy="100" r="48" fill="#faf7f2" />
        <circle cx="100" cy="100" r="48" fill="none" stroke="#e6ddd3" strokeWidth="1" />
      </svg>

      <span className="absolute bottom-3 left-3 rounded-full bg-ivory/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-soft shadow-sm">
        Photo soon
      </span>
    </div>
  )
}
