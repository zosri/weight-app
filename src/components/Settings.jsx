import React, { useRef, useState } from 'react'
import { C, T, W } from '../tokens.js'
import { PROFILE_LIMITS, parseBackup, applyBackup } from '../lib/storage.js'

const FIELDS = [
  { key: 'height',       label: 'Ύψος',              unit: 'cm' },
  { key: 'age',          label: 'Ηλικία',            unit: 'ετών' },
  { key: 'targetIntake', label: 'Στόχος πρόσληψης',  unit: 'kcal' },
  { key: 'steps',        label: 'Βήματα, προεπιλογή', unit: '',
    hint: 'Χρησιμοποιείται μόνο όσο δεν έχεις καταχωρήσει πραγματικά βήματα.' },
]

// Κάτω από αυτό το όριο η εκτίμηση δεν χαλάει, αλλά αξίζει μια κουβέντα
// με γιατρό πριν το κυνηγήσεις. Ένδειξη, όχι φράγμα.
const LOW_INTAKE = 1200

const shortDate = (t) => {
  const d = new Date(t)
  return `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`
}

const btn = (filled) => ({
  flex: 1, padding: '11px 0', fontSize: T.sm, fontWeight: W.normal,
  cursor: 'pointer', border: `1px solid ${filled ? C.ink : C.grid}`,
  background: filled ? C.ink : 'transparent', color: filled ? C.paper : C.ink,
})

/**
 * Ρυθμίσεις προφίλ και διαχείριση δεδομένων.
 *
 * Η επαναφορά είναι ο λόγος που υπάρχει αυτό το πάνελ: χωρίς αυτήν το
 * αντίγραφο ασφαλείας είναι ένα JSON που δεν το διαβάζει κανείς. Η ροή
 * είναι επίτηδες σε δύο βήματα — πρώτα διαβάζεται και ελέγχεται το αρχείο
 * και δείχνει τι βρήκε, μετά αποφασίζεις συγχώνευση ή αντικατάσταση.
 * Πριν από κάθε αντικατάσταση κατεβαίνει αυτόματα αντίγραφο των τωρινών.
 */
export default function Settings({ profile, onProfile, onMeasurements, onExport, count }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)
  const [staged, setStaged] = useState(null)   // αποτέλεσμα parseBackup
  const [error, setError] = useState(null)
  const [note, setNote] = useState(null)
  const fileRef = useRef(null)

  const set = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setSaved(false)
  }

  const commit = () => {
    const stored = onProfile(draft)
    if (stored) setDraft(stored)   // δείχνει πίσω την τιμή μετά τα όρια
    setSaved(true)
  }

  const pickFile = () => {
    setError(null)
    setNote(null)
    fileRef.current?.click()
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''            // ώστε να ξαναδουλέψει με το ίδιο αρχείο
    if (!file) return
    try {
      const parsed = parseBackup(await file.text())
      setStaged(parsed)
      setError(null)
    } catch (err) {
      setStaged(null)
      setError(err.message)
    }
  }

  const restore = (mode) => {
    if (mode === 'replace' && count > 0) onExport()   // δίχτυ πριν το σβήσιμο
    const next = applyBackup(staged, mode)
    onMeasurements(next)
    if (staged.profile) {
      const stored = onProfile(staged.profile)
      if (stored) setDraft(stored)
    }
    setNote(mode === 'merge'
      ? `Συγχώνευση έγινε — ${next.length} μετρήσεις συνολικά.`
      : `Επαναφορά έγινε — ${next.length} μετρήσεις.`)
    setStaged(null)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        padding: '13px', fontSize: T.sm, fontWeight: W.normal, cursor: 'pointer',
        border: `1px solid ${C.grid}`, background: 'transparent', color: C.muted,
      }}>
        Ρυθμίσεις και δεδομένα
      </button>
    )
  }

  const lowTarget = Number(draft.targetIntake) < LOW_INTAKE

  return (
    <section style={{ background: C.panel, border: `1px solid ${C.grid}`, padding: '16px 16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h2 style={{ fontSize: T.base, fontWeight: W.medium, margin: 0 }}>Ρυθμίσεις και δεδομένα</h2>
        <button onClick={() => setOpen(false)} aria-label="Κλείσιμο"
                style={{ border: 'none', background: 'transparent', color: C.muted,
                         cursor: 'pointer', fontSize: T.lg, padding: '0 4px' }}>×</button>
      </div>

      {FIELDS.map((f) => (
        <div key={f.key} style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: T.xs, color: C.muted, marginBottom: 5 }}>
            {f.label}{f.unit && ` (${f.unit})`}
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={PROFILE_LIMITS[f.key].min}
            max={PROFILE_LIMITS[f.key].max}
            step={PROFILE_LIMITS[f.key].step}
            value={draft[f.key] ?? ''}
            onChange={(e) => set(f.key, e.target.value)}
            style={{
              display: 'block', width: '100%', padding: '9px 12px',
              fontSize: T.base, fontWeight: W.normal, color: C.ink,
              background: 'transparent', border: `1px solid ${C.grid}`,
              borderRadius: 0, outline: 'none', textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          {f.hint && (
            <div style={{ fontSize: T.xs, color: C.muted, marginTop: 4, lineHeight: 1.35 }}>{f.hint}</div>
          )}
        </div>
      ))}

      {lowTarget && (
        <div style={{ fontSize: T.xs, color: C.target, lineHeight: 1.4, marginBottom: 12 }}>
          Στόχος κάτω από {LOW_INTAKE} kcal. Η εκτίμηση δουλεύει κανονικά, αλλά
          τόσο χαμηλά συνήθως θέλει επίβλεψη γιατρού — αξίζει μια κουβέντα πρώτα.
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: T.xs, color: C.muted, marginBottom: 5 }}>Φύλο</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['Άνδρας', 'm'], ['Γυναίκα', 'f']].map(([label, v]) => (
            <button key={v} onClick={() => set('sex', v)} style={btn(draft.sex === v)}>{label}</button>
          ))}
        </div>
      </div>

      <button onClick={commit} style={{
        display: 'block', width: '100%', padding: '14px 0', marginBottom: 6,
        fontSize: T.base, fontWeight: W.medium, cursor: 'pointer',
        border: 'none', background: C.ink, color: C.paper,
      }}>
        Αποθήκευση
      </button>
      {saved && (
        <div style={{ fontSize: T.xs, color: C.muted, textAlign: 'center', marginBottom: 6 }}>
          Αποθηκεύτηκε · τα νούμερα ξαναϋπολογίστηκαν
        </div>
      )}

      <div style={{ borderTop: `1px solid ${C.grid}`, margin: '16px 0 14px' }} />

      <div style={{ fontSize: T.sm, fontWeight: W.medium, marginBottom: 4 }}>Αντίγραφο ασφαλείας</div>
      <div style={{ fontSize: T.xs, color: C.muted, lineHeight: 1.4, marginBottom: 10 }}>
        Τα δεδομένα ζουν μόνο σε αυτό το κινητό. Καθαρισμός δεδομένων περιήγησης
        ή αλλαγή συσκευής τα σβήνει. Κράτα αρχείο κάθε τόσο.
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onExport} disabled={!count} style={{ ...btn(false), opacity: count ? 1 : 0.45 }}>
          Εξαγωγή
        </button>
        <button onClick={pickFile} style={btn(false)}>Επαναφορά</button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json"
             onChange={onFile} style={{ display: 'none' }} />

      {error && (
        <div style={{ marginTop: 10, fontSize: T.sm, color: C.target, lineHeight: 1.4 }}>{error}</div>
      )}
      {note && (
        <div style={{ marginTop: 10, fontSize: T.sm, color: C.muted, lineHeight: 1.4 }}>{note}</div>
      )}

      {staged && (
        <div style={{ marginTop: 12, border: `1px solid ${C.grid}`, padding: '12px' }}>
          <div style={{ fontSize: T.sm, lineHeight: 1.45, marginBottom: 10 }}>
            Βρέθηκαν <strong>{staged.measurements.length}</strong> μετρήσεις,
            {' '}{shortDate(staged.from)} – {shortDate(staged.to)}
            {staged.profile ? ', μαζί με προφίλ.' : '.'}
          </div>
          <div style={{ fontSize: T.xs, color: C.muted, lineHeight: 1.4, marginBottom: 10 }}>
            Συγχώνευση: κρατά τις {count} τωρινές και προσθέτει όσες λείπουν.
            Αντικατάσταση: σβήνει τις τωρινές — κατεβάζει πρώτα αντίγραφό τους.
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => restore('merge')} style={btn(true)}>Συγχώνευση</button>
            <button onClick={() => restore('replace')} style={btn(false)}>Αντικατάσταση</button>
          </div>
          <button onClick={() => setStaged(null)} style={{
            display: 'block', width: '100%', marginTop: 6, padding: '9px 0',
            fontSize: T.xs, fontWeight: W.normal, cursor: 'pointer',
            border: 'none', background: 'transparent', color: C.muted,
          }}>
            Άκυρο
          </button>
        </div>
      )}
    </section>
  )
}
