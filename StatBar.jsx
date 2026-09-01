import React from 'react'
import { C, T, W } from '../tokens.js'

/**
 * Τα βασικά νούμερα σε γραμμές, όχι στήλες.
 * Σε οθόνη κινητού τρεις στήλες δεν χωράνε και σπρώχνουν
 * ολόκληρη τη σελίδα πλάγια.
 */
export default function StatBar({ items }) {
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.grid}` }}>
      {items.map((it, i) => (
        <div
          key={it.label}
          style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            gap: 12, padding: '15px 18px',
            borderTop: i ? `1px solid ${C.grid}` : 'none',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: T.sm, fontWeight: W.normal, color: C.ink }}>{it.label}</div>
            {it.note && (
              <div style={{ fontSize: T.xs, color: C.muted, marginTop: 3, lineHeight: 1.35 }}>
                {it.note}
              </div>
            )}
          </div>
          <div style={{
            fontSize: T.xl, fontWeight: W.medium, color: C.ink,
            fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', lineHeight: 1.1,
          }}>
            {it.value}
            {it.unit && (
              <span style={{ fontSize: T.sm, color: C.muted, marginLeft: 4, fontWeight: W.normal }}>
                {it.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </section>
  )
}
