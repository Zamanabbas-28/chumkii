import { motion, useReducedMotion } from 'framer-motion'

const styleDecor = {
  'simple-thread': { dots: 0, mirrors: 0, stones: 0 },
  'stone-work': { dots: 0, mirrors: 0, stones: 8 },
  'mirror-work': { dots: 0, mirrors: 10, stones: 0 },
  heavy: { dots: 12, mirrors: 6, stones: 6 },
  minimal: { dots: 4, mirrors: 0, stones: 0 },
  surprise: { dots: 8, mirrors: 4, stones: 4 },
}

function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

/** Rounded square path centered at 100,100 */
function squareRingPath(outer, inner, radius = 18) {
  // Approximate as outer rounded rect stroke via two nested paths isn't fill-rule easy;
  // we stroke a rounded rect at mid radius instead.
  const mid = (outer + inner) / 2
  const half = mid
  const r = Math.min(radius, half * 0.35)
  const x = 100 - half
  const y = 100 - half
  const s = half * 2
  return `M ${x + r} ${y} H ${x + s - r} Q ${x + s} ${y} ${x + s} ${y + r} V ${y + s - r} Q ${x + s} ${y + s} ${x + s - r} ${y + s} H ${x + r} Q ${x} ${y + s} ${x} ${y + s - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
}

export default function BanglePreview({
  baseColor = '#c23b3b',
  accentColors = ['#c4a574'],
  styleId = 'simple-thread',
  shape = 'round',
  sizeType = 'big',
  threadingId = 'none',
  compact = false,
}) {
  const reduce = useReducedMotion()
  const accent = accentColors[0] || '#c4a574'
  const accent2 = accentColors[1] || accent
  const decor = styleDecor[styleId] || styleDecor['simple-thread']
  const cx = 100
  const cy = 100
  const big = sizeType !== 'small'
  const outerR = big ? 72 : 58
  const innerR = big ? 48 : 40
  const strokeW = outerR - innerR
  const midR = (outerR + innerR) / 2
  const uid = `bp-${shape}-${sizeType}-${String(baseColor).replace('#', '')}`

  const squarePath = squareRingPath(outerR, innerR)

  return (
    <div
      className={`relative overflow-hidden ${
        compact
          ? 'h-full w-full p-1'
          : 'rounded-3xl border border-border-soft bg-gradient-to-br from-cream via-ivory to-soft-lavender/40 p-6'
      }`}
    >
      {!compact && (
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-gold">
          Live preview
        </p>
      )}
      <div
        className={`mx-auto flex items-center justify-center ${
          compact ? 'h-full w-full' : 'mt-2 aspect-square max-w-[260px]'
        }`}
      >
        <motion.svg
          viewBox="0 0 200 200"
          className="h-full w-full drop-shadow-md"
          initial={false}
          animate={reduce ? undefined : { scale: 1 }}
        >
          <defs>
            <radialGradient id={`${uid}-glow`} cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
            </radialGradient>
            <linearGradient id={`${uid}-silver`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8e8e8" />
              <stop offset="45%" stopColor="#b8b8b8" />
              <stop offset="100%" stopColor="#f5f5f5" />
            </linearGradient>
          </defs>

          {shape === 'square' ? (
            <>
              <path
                d={squarePath}
                fill="none"
                stroke={baseColor}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
              <path
                d={squarePath}
                fill="none"
                stroke={`url(#${uid}-glow)`}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
              <path
                d={squarePath}
                fill="none"
                stroke={accent}
                strokeWidth={2.5}
                strokeDasharray="3 9"
                strokeLinejoin="round"
                opacity={0.85}
              />
              {threadingId === 'silver' && (
                <path
                  d={squarePath}
                  fill="none"
                  stroke={`url(#${uid}-silver)`}
                  strokeWidth={1.6}
                  strokeDasharray="1.5 5.5"
                  strokeLinejoin="round"
                  opacity={0.95}
                />
              )}
            </>
          ) : (
            <>
              <circle
                cx={cx}
                cy={cy}
                r={midR}
                fill="none"
                stroke={baseColor}
                strokeWidth={strokeW}
              />
              <circle
                cx={cx}
                cy={cy}
                r={midR}
                fill="none"
                stroke={`url(#${uid}-glow)`}
                strokeWidth={strokeW}
              />
              <circle
                cx={cx}
                cy={cy}
                r={midR}
                fill="none"
                stroke={accent}
                strokeWidth={3}
                strokeDasharray="4 10"
                opacity={0.9}
              />
              {threadingId === 'silver' && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={midR}
                  fill="none"
                  stroke={`url(#${uid}-silver)`}
                  strokeWidth={1.8}
                  strokeDasharray="1.2 4.8"
                  opacity={0.95}
                />
              )}
            </>
          )}

          {Array.from({ length: decor.dots }).map((_, i) => {
            const p = polar(cx, cy, midR, (360 / Math.max(decor.dots, 1)) * i)
            return (
              <circle
                key={`d-${i}`}
                cx={p.x}
                cy={p.y}
                r={2.2}
                fill={accent2}
                stroke="#fff"
                strokeWidth={0.4}
              />
            )
          })}
          {Array.from({ length: decor.mirrors }).map((_, i) => {
            const p = polar(cx, cy, midR, (360 / Math.max(decor.mirrors, 1)) * i + 8)
            return (
              <rect
                key={`m-${i}`}
                x={p.x - 3}
                y={p.y - 3}
                width={6}
                height={6}
                fill="#e8f4ff"
                stroke={accent}
                strokeWidth={0.6}
                transform={`rotate(45 ${p.x} ${p.y})`}
              />
            )
          })}
          {Array.from({ length: decor.stones }).map((_, i) => {
            const p = polar(cx, cy, midR, (360 / Math.max(decor.stones, 1)) * i + 18)
            return (
              <ellipse
                key={`s-${i}`}
                cx={p.x}
                cy={p.y}
                rx={3.5}
                ry={4.5}
                fill={accent2}
                stroke="#d4af37"
                strokeWidth={0.8}
              />
            )
          })}

          {shape === 'square' ? (
            <rect
              x={100 - (innerR - 2)}
              y={100 - (innerR - 2)}
              width={(innerR - 2) * 2}
              height={(innerR - 2) * 2}
              rx={10}
              fill="#faf7f2"
              stroke="#e6ddd3"
            />
          ) : (
            <>
              <circle cx={cx} cy={cy} r={innerR - 1} fill="#faf7f2" />
              <circle
                cx={cx}
                cy={cy}
                r={innerR - 1}
                fill="none"
                stroke="#e6ddd3"
                strokeWidth={1}
              />
            </>
          )}
        </motion.svg>
      </div>
      {!compact && (
        <p className="mt-2 text-center text-xs leading-relaxed text-ink-soft">
          Preview for inspiration only. Handmade details may vary slightly.
        </p>
      )}
    </div>
  )
}
