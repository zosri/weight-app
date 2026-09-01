import React from 'react'
import { C, T, W } from '../tokens.js'

/**
 * Γράφημα βάρους χωρίς εξωτερική βιβλιοθήκη.
 * Κουκκίδες = ακατέργαστες μετρήσεις, γραμμή = τάση.
 * Ο κάθετος άξονας κρατά παράθυρο τουλάχιστον 6 kg ώστε ο θόρυβος
 * του νερού να μη μοιάζει με δραματική αλλαγή.
 */
const W_VB = 340, H_VB = 200
const PAD = { top: 12, right: 10, bottom: 26, left: 44 }
const MIN_SPAN = 6

export default function TrendChart({ points, empty }) {
  if (!points || points.length === 0) {
    return (
      <div style={{
        background: C.panel, border: `1px solid ${C.grid}`, padding: '30px 18px',
        fontSize: T.sm, color: C.muted, textAlign: 'center', lineHeight: 1.5,
      }}>
        {empty || 'Καταχώρησε το πρώτο σου ζύγισμα για να ξεκινήσει το γράφημα.'}
      </div>
    )
  }

  const iw = W_VB - PAD.left - PAD.right
  const ih = H_VB - PAD.top - PAD.bottom

  const ts = points.map((p) => p.t)
  const t0 = Math.min(...ts)
  const t1 = Math.max(...ts)
  const span = Math.max(t1 - t0, 86400000)

  const vals = points.flatMap((p) => [p.weight, p.ewma])
  let lo = Math.min(...vals), hi = Math.max(...vals)
  const pad = Math.max(0, (MIN_SPAN - (hi - lo)) / 2) + 0.25
  lo -= pad; hi += pad

  const x = (t) => PAD.left + ((t - t0) / span) * iw
  const y = (v) => PAD.top + (1 - (v - lo) / (hi - lo)) * ih

  const line = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.ewma).toFixed(1)}`)
    .join(' ')

  const ticks = [lo, (lo + hi) / 2, hi]
  const dayFmt = (t) => {
    const d = new Date(t)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.grid}`, padding: '14px 10px 10px' }}>
      <svg viewBox={`0 0 ${W_VB} ${H_VB}`} width="100%" role="img"
           aria-label="Γράφημα βάρους με γραμμή τάσης">
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W_VB - PAD.right} y1={y(v)} y2={y(v)}
                  stroke={C.grid} strokeDasharray="2 4" />
            <text x={PAD.left - 7} y={y(v) + 4.5} textAnchor="end"
                  fontSize="12" fontWeight="500" fill={C.muted}>{v.toFixed(1)}</text>
          </g>
        ))}

        <text x={PAD.left} y={H_VB - 7} fontSize="12" fontWeight="500" fill={C.muted}>
          {dayFmt(t0)}
        </text>
        <text x={W_VB - PAD.right} y={H_VB - 7} fontSize="12" fontWeight="500"
              fill={C.muted} textAnchor="end">{dayFmt(t1)}</text>

        {points.map((p) => (
          <circle key={p.id} cx={x(p.t)} cy={y(p.weight)} r="3"
                  fill={p.slot === 'evening' ? C.evening : C.raw} fillOpacity="0.7" />
        ))}

        {points.length > 1 && (
          <path d={line} fill="none" stroke={C.trend} strokeWidth="2.6"
                strokeLinejoin="round" strokeLinecap="round" />
        )}
      </svg>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: T.xs,
        fontWeight: 500, color: C.muted, padding: '4px 4px 2px',
      }}>
        <Legend color={C.raw} label="πρωί" />
        <Legend color={C.evening} label="βράδυ" />
        <Legend color={C.trend} label="τάση" line />
      </div>
    </div>
  )
}

function Legend({ color, label, line }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: line ? 14 : 8, height: line ? 3 : 8,
        borderRadius: line ? 0 : '50%', background: color, flexShrink: 0,
      }} />
      {label}
    </span>
  )
}
