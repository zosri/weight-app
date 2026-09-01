import React from 'react'
import { C } from '../tokens.js'
import { formatDateTime, SLOT_LABEL } from '../lib/date.js'

export default function MeasurementList({ points, onDelete }) {
  if (!points.length) return null
  const recent = [...points].reverse().slice(0, 12)

  return (
    <section>
      <h2 style={{ fontSize: 13.5, fontWeight: 500, margin: '0 0 8px' }}>Τελευταίες μετρήσεις</h2>
      {recent.map((p) => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'baseline', gap: 10,
          padding: '9px 4px', borderBottom: `1px solid ${C.grid}`, fontSize: 13.5,
        }}>
          <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 58 }}>
            {p.weight.toFixed(1)} kg
          </span>
          <span style={{ color: C.muted, fontSize: 12, flex: 1 }}>
            {formatDateTime(p.t)} · {SLOT_LABEL[p.slot]}
          </span>
          <span style={{ color: C.muted, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            τάση {p.ewma.toFixed(2)}
          </span>
          <button onClick={() => onDelete(p.id)} aria-label="Διαγραφή μέτρησης"
                  style={{
                    border: 'none', background: 'transparent', color: C.muted,
                    cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', padding: '0 4px',
                  }}>×</button>
        </div>
      ))}
    </section>
  )
}
