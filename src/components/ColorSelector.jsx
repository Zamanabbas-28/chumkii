export default function ColorSelector({
  colors,
  value,
  onChange,
  multiple = false,
  values = [],
}) {
  const isSelected = (id) =>
    multiple ? values.includes(id) : value === id

  const toggle = (id) => {
    if (multiple) {
      if (values.includes(id)) {
        onChange(values.filter((v) => v !== id))
      } else {
        onChange([...values, id])
      }
    } else {
      onChange(id)
    }
  }

  return (
    <div className="flex flex-wrap gap-2.5" role="listbox" aria-multiselectable={multiple}>
      {colors.map((color) => {
        const selected = isSelected(color.id)
        return (
          <button
            key={color.id}
            type="button"
            role="option"
            aria-selected={selected}
            title={color.name}
            onClick={() => toggle(color.id)}
            className={`group flex min-h-11 min-w-11 flex-col items-center gap-1.5 rounded-xl p-1.5 transition ${
              selected ? 'bg-cream ring-2 ring-gold' : 'hover:bg-cream/80'
            }`}
          >
            <span
              className={`h-8 w-8 rounded-full border shadow-sm ${
                color.hex.toLowerCase() === '#f5f2eb' ||
                color.hex.toLowerCase() === '#f0e6d8'
                  ? 'border-border-soft'
                  : 'border-white/40'
              }`}
              style={{ backgroundColor: color.hex }}
            />
            <span className="max-w-[4.5rem] truncate text-[10px] font-medium text-ink-soft">
              {color.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
