import React from 'react'
import { C, T, W } from '../tokens.js'
import { formatDateTime, SLOT_LABEL } from '../lib/date.js'

export default function MeasurementList({ points, onDelete }) {
  if (!points.length) return null
  const recent = [...points].reverse().slice(0, 12)

  return (
    <section>
      <h2 style={{ fontSize: T.base, fontWeight: W.medium, margin: '0 0 6px' }}>
        Τελευταίες μετρήσεις
      </h2>
      {recent.map((p) => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'baseline', gap: 10,
          padding: '11px 2px', borderBottom: `1px solid ${C.grid}`,
        }}>
          <span style={{
            fontSize: T.base, fontWeight: W.medium,
            fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
          }}>
            {p.weight.toFixed(1)}
          </span>
          <span style={{ flex: 1, fontSize: T.xs, color: C.muted, lineHeight: 1.3 }}>
            {formatDateTime(p.t)}<br />{SLOT_LABEL[p.slot]} · τάση {p.ewma.toFixed(2)}
          </span>
          <button onClick={() => onDelete(p.id)} aria-label="Διαγραφή μέτρησης"
                  style={{
                    border: 'none', background: 'transparent', color: C.muted,
                    cursor: 'pointer', fontSize: T.lg, padding: '2px 8px',
                  }}>×</button>
        </div>
      ))}
    </section>
  )
}
