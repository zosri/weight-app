import React, { useState } from 'react'
import { C, T, W } from '../tokens.js'
import { slotFromTime, SLOT_LABEL, formatDateTime } from '../lib/date.js'

/**
 * Εισαγωγή βάρους. Ημερομηνία και ώρα έρχονται από το σύστημα —
 * ο χρήστης πληκτρολογεί μόνο τον αριθμό.
 */
export default function WeightEntry({ onSave }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)
  const now = Date.now()
  const slot = slotFromTime(now)

  const submit = () => {
    const w = parseFloat(String(value).replace(',', '.'))
    if (!Number.isFinite(w) || w < 25 || w > 400) {
      setError('Δώσε βάρος μεταξύ 25 και 400 kg')
      return
    }
    setError(null)
    setValue('')
    onSave({ t: Date.now(), weight: +w.toFixed(2), slot: slotFromTime(Date.now()) })
  }

  return (
    <section style={{ background: C.panel, border: `1px solid ${C.grid}`, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: T.sm, color: C.muted, marginBottom: 12, fontWeight: W.normal }}>
        {formatDateTime(now)} · ζύγισμα {SLOT_LABEL[slot]}
      </div>

      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        placeholder="0.0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        aria-label="Βάρος σε κιλά"
        style={{
          display: 'block', width: '100%', padding: '10px 14px',
          fontSize: T.huge, fontWeight: W.medium, color: C.ink,
          background: 'transparent', border: `1px solid ${C.grid}`,
          borderRadius: 0, outline: 'none', textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      />

      <button
        onClick={submit}
        style={{
          display: 'block', width: '100%', marginTop: 10, padding: '15px 0',
          fontSize: T.base, fontWeight: W.medium, cursor: 'pointer',
          border: 'none', background: C.ink, color: C.paper,
        }}
      >
        Καταχώρηση
      </button>

      {error && (
        <div style={{ marginTop: 10, fontSize: T.sm, color: C.target, fontWeight: W.normal }}>
          {error}
        </div>
      )}
    </section>
  )
}
