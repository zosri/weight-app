import React, { useState } from 'react'
import { C, T, W } from '../tokens.js'
import { slotFromTime, SLOT_LABEL, formatDateTime, previousDayKey } from '../lib/date.js'

const ANSWER_LABEL = { yes: 'Ναι', no: 'Όχι', skip: 'Παράλειψη' }

/** Ημέρα (τοπική) που ανήκει ένα timestamp — για σύγκριση με το «σήμερα». */
function isSameDay(t1, t2) {
  const a = new Date(t1), b = new Date(t2)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * Εισαγωγή βάρους. Ημερομηνία και ώρα έρχονται από το σύστημα —
 * ο χρήστης πληκτρολογεί μόνο τον αριθμό.
 *
 * Το πρωινό ζύγισμα (ώρα < 11) παίρνει πάντα βήματα + ερωτήσεις.
 * Αν όμως δεν υπάρχει ακόμα καμία μέτρηση σήμερα και η ώρα έχει
 * περάσει το πρωινό όριο (π.χ. ξύπνημα Σαββατοκύριακου μετά τις 12:00),
 * ρωτάμε ρητά αν είναι η πρώτη μέτρηση της ημέρας — αν ναι, παίρνει
 * τα ίδια βήματα + ερωτήσεις σαν να ήταν πρωινό.
 *
 * Αν παραλειφθούν τα βήματα, δεν αποθηκεύεται καθόλου — δεν
 * μετράει σαν 0 βήματα.
 */
export default function WeightEntry({ onSave, activeQuestions = [], measurements = [] }) {
  const [value, setValue] = useState('')
  const [steps, setSteps] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null) // { measurement, answers }
  const [firstOfDay, setFirstOfDay] = useState(null) // null | true | false
  const now = Date.now()
  const slot = slotFromTime(now)

  const noMeasurementToday = !measurements.some((m) => isSameDay(m.t, now))
  const needsFirstOfDayPrompt = slot !== 'morning' && noMeasurementToday
  const wantsExtras = slot === 'morning' || (needsFirstOfDayPrompt && firstOfDay === true)

  const submit = () => {
    const w = parseFloat(String(value).replace(',', '.'))
    if (!Number.isFinite(w) || w < 25 || w > 400) {
      setError('Δώσε βάρος μεταξύ 25 και 400 kg')
      return
    }
    setError(null)

    const t = Date.now()
    const m = { t, weight: +w.toFixed(2), slot: slotFromTime(t) }

    if (wantsExtras && String(steps).trim() !== '') {
      const s = parseInt(String(steps).replace(/\D/g, ''), 10)
      if (Number.isFinite(s) && s >= 0 && s <= 100000) {
        m.steps = s
        m.refersTo = previousDayKey(t)
      }
    }

    setValue('')
    setSteps('')
    setFirstOfDay(null)

    if (wantsExtras && activeQuestions.length > 0) {
      setPending({ measurement: m, answers: {} })
    } else {
      onSave(m)
    }
  }

  const answer = (id, v) => {
    setPending((p) => ({ ...p, answers: { ...p.answers, [id]: v } }))
  }

  const finish = () => {
    const { measurement, answers } = pending
    // ό,τι δεν απαντήθηκε ρητά λογίζεται ως παράλειψη, όχι ως 'no'
    const filled = {}
    for (const q of activeQuestions) filled[q.id] = answers[q.id] || 'skip'
    onSave({ ...measurement, answers: filled, refersTo: measurement.refersTo || previousDayKey(measurement.t) })
    setPending(null)
  }

  if (pending) {
    return (
      <section style={{ background: C.panel, border: `1px solid ${C.grid}`, padding: '16px 16px 18px' }}>
        <div style={{ fontSize: T.huge, fontWeight: W.medium, color: C.ink, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
          {pending.measurement.weight.toFixed(1)} kg
        </div>
        <div style={{ fontSize: T.xs, color: C.muted, textAlign: 'center', marginBottom: 16 }}>
          καταχωρήθηκε · μερικές γρήγορες ερωτήσεις για το χθες
        </div>

        {activeQuestions.map((q) => (
          <div key={q.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: T.sm, color: C.ink, marginBottom: 6 }}>{q.text}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['yes', 'no', 'skip'].map((v) => (
                <button
                  key={v}
                  onClick={() => answer(q.id, v)}
                  style={{
                    flex: 1, padding: '9px 0', fontSize: T.xs, fontWeight: W.normal,
                    cursor: 'pointer', border: `1px solid ${C.grid}`,
                    background: pending.answers[q.id] === v ? C.ink : 'transparent',
                    color: pending.answers[q.id] === v ? C.paper : C.ink,
                  }}
                >
                  {ANSWER_LABEL[v]}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={finish}
          style={{
            display: 'block', width: '100%', marginTop: 6, padding: '15px 0',
            fontSize: T.base, fontWeight: W.medium, cursor: 'pointer',
            border: 'none', background: C.ink, color: C.paper,
          }}
        >
          Ολοκλήρωση
        </button>
      </section>
    )
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

      {needsFirstOfDayPrompt && (
        <div style={{ marginTop: 10 }}>
          <label style={{ display: 'block', fontSize: T.xs, color: C.muted, marginBottom: 5 }}>
            Είναι η πρώτη μέτρηση της ημέρας;
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['Ναι', true], ['Όχι', false]].map(([label, v]) => (
              <button
                key={label}
                onClick={() => setFirstOfDay(v)}
                style={{
                  flex: 1, padding: '9px 0', fontSize: T.xs, fontWeight: W.normal,
                  cursor: 'pointer', border: `1px solid ${C.grid}`,
                  background: firstOfDay === v ? C.ink : 'transparent',
                  color: firstOfDay === v ? C.paper : C.ink,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {wantsExtras && (
        <div style={{ marginTop: 10 }}>
          <label style={{ display: 'block', fontSize: T.xs, color: C.muted, marginBottom: 5 }}>
            Βήματα χθες (προαιρετικό)
          </label>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            placeholder="π.χ. 3200"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            aria-label="Βήματα χθες"
            style={{
              display: 'block', width: '100%', padding: '9px 12px',
              fontSize: T.base, fontWeight: W.normal, color: C.ink,
              background: 'transparent', border: `1px solid ${C.grid}`,
              borderRadius: 0, outline: 'none', textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </div>
      )}

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
