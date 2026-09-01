import React from 'react'
import { C } from '../tokens.js'

function Cell({ label, value, unit, note }) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 130, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 300, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
        {unit && <span style={{ fontSize: 13, color: C.muted, marginLeft: 4 }}>{unit}</span>}
      </div>
      {note && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>{note}</div>}
    </div>
  )
}

export default function StatBar({ items }) {
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap', background: C.panel, border: `1px solid ${C.grid}` }}>
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 && <div style={{ width: 1, background: C.grid }} />}
          <Cell {...it} />
        </React.Fragment>
      ))}
    </section>
  )
}
