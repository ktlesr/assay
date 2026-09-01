import './tokens.css'

export interface DataListItem { id: string; label: string; value: string }

/** Mevcut liste bileşeni. Yeni bileşenler bunun görsel dilini izler. */
export function DataList({ items }: { items: DataListItem[] }) {
  return (
    <ul
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        color: 'var(--color-text)',
        font: 'var(--font-size-md) var(--font-sans)',
        listStyle: 'none',
        margin: 0,
        padding: 'var(--space-2)',
      }}
    >
      {items.map((item) => (
        <li
          key={item.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
          <span>{item.value}</span>
        </li>
      ))}
    </ul>
  )
}
