import React, { useState, useMemo } from 'react'
import { C, T, W, FONT } from './tokens.js'
import { loadMeasurements, addMeasurement, deleteMeasurement, loadProfile, exportJSON } from './lib/storage.js'
import { ewma, slopePerDay, balanceFromSlope } from './lib/trend.js'
import { bmr, tdee } from './lib/metabolism.js'
import WeightEntry from './components/WeightEntry.jsx'
import StatBar from './components/StatBar.jsx'
import TrendChart from './components/TrendChart.jsx'
import MeasurementList from './components/MeasurementList.jsx'

const RANGES = [[14, '14 ημ.'], [30, '30 ημ.'], [90, '90 ημ.'], [0, 'Όλα']]

export default function App() {
  const [raw, setRaw] = useState(loadMeasurements)
  const [range, setRange] = useState(30)
  const profile = loadProfile()

  const points = useMemo(() => ewma(raw), [raw])

  const visible = useMemo(() => {
    if (!range) return points
    const cutoff = Date.now() - range * 86400000
    return points.filter((p) => p.t >= cutoff)
  }, [points, range])

  const last = points[points.length - 1]
  const slope = slopePerDay(points, 14)
  const balance = balanceFromSlope(slope)
  const weekly = slope === null ? null : slope * 7

  const currentTdee = last
    ? tdee({ ...profile, weight: last.ewma, steps: profile.steps })
    : null

  const stats = [
    {
      label: 'Τάση βάρους',
      value: last ? last.ewma.toFixed(1) : '—',
      unit: last ? 'kg' : '',
      note: weekly === null
        ? 'χρειάζονται 2 εβδομάδες'
        : `${weekly > 0 ? '+' : '−'}${Math.abs(weekly).toFixed(2)} kg την εβδομάδα`,
    },
    {
      label: 'Ενεργειακό ισοζύγιο',
      value: balance === null ? '—' : Math.round(Math.abs(balance)),
      unit: balance === null ? '' : 'kcal',
      note: balance === null
        ? 'από την κλίση 14 ημερών'
        : balance < 0 ? 'έλλειμμα την ημέρα' : 'πλεόνασμα την ημέρα',
    },
    {
      label: 'TDEE',
      value: currentTdee ? Math.round(currentTdee) : '—',
      unit: currentTdee ? 'kcal' : '',
      note: last ? `BMR ${Math.round(bmr({ ...profile, weight: last.ewma }))} + κίνηση` : '',
    },
  ]

  const save = (m) => setRaw(addMeasurement(m))
  const remove = (id) => setRaw(deleteMeasurement(id))

  const backup = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `varos-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div style={{
      background: C.paper, minHeight: '100vh', color: C.ink, fontFamily: FONT,
      fontSize: T.base, fontWeight: W.normal,
      padding: '18px 14px calc(34px + env(safe-area-inset-bottom))',
    }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gap: 14 }}>

        <header>
          <h1 style={{ fontSize: T.lg, fontWeight: W.bold, margin: 0, letterSpacing: '-.01em' }}>
            Βάρος και ενέργεια
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: T.sm, color: C.muted }}>
            {raw.length} {raw.length === 1 ? 'μέτρηση' : 'μετρήσεις'}
          </p>
        </header>

        <WeightEntry onSave={save} />
        <StatBar items={stats} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {RANGES.map(([v, l]) => (
            <button key={v} onClick={() => setRange(v)} style={{
              flex: '1 1 auto', padding: '10px 6px', fontSize: T.sm,
              fontWeight: W.normal, cursor: 'pointer',
              border: `1px solid ${range === v ? C.ink : C.grid}`,
              background: range === v ? C.ink : 'transparent',
              color: range === v ? C.paper : C.muted,
            }}>{l}</button>
          ))}
        </div>

        <TrendChart points={visible}
                    empty={raw.length ? 'Καμία μέτρηση σε αυτό το διάστημα.' : undefined} />

        <MeasurementList points={points} onDelete={remove} />

        {raw.length > 0 && (
          <button onClick={backup} style={{
            padding: '13px', fontSize: T.sm, fontWeight: W.normal, cursor: 'pointer',
            border: `1px solid ${C.grid}`, background: 'transparent', color: C.muted,
          }}>
            Αποθήκευση αντιγράφου ασφαλείας
          </button>
        )}
      </div>
    </div>
  )
}
