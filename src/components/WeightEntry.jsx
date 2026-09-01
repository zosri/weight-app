import React, { useState } from 'react'
import { C } from '../tokens.js'
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
    <section style={{ background: C.panel, border: `1px solid ${C.grid}`, padding: '18px 20px' }}>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 12 }}>
        {formatDateTime(now)} · ζύγισμα {SLOT_LABEL[slot]}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
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
            flex: 1, minWidth: 0, padding: '12px 14px', fontSize: 26, fontWeight: 300,
            fontFamily: 'inherit', color: C.ink, background: 'transparent',
            border: `1px solid ${C.grid}`, borderRadius: 0, outline: 'none',
          }}
        />
        <button
          onClick={submit}
          style={{
            padding: '0 22px', fontSize: 14.5, fontFamily: 'inherit', cursor: 'pointer',
            border: 'none', background: C.ink, color: C.paper,
          }}
        >
          Καταχώρηση
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 9, fontSize: 12.5, color: C.target }}>{error}</div>
      )}
    </section>
  )
}
