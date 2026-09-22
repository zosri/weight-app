import React from 'react'
import { C, T, W } from '../tokens.js'
import { MIN_GROUP } from '../lib/insights.js'
import { formatAnswer } from '../lib/questions.js'

const kg = (n) => `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(2)} kg`

/**
 * Το πάνελ των insights.
 *
 * Δείχνει διαφορά και διάστημα εμπιστοσύνης, ποτέ ετυμηγορία. Ο ημερήσιος
 * θόρυβος του βάρους είναι γύρω στο μισό κιλό και η επίδραση μιας συνήθειας
 * ίσως 100-200 γραμμάρια· με οκτώ μέρες ανά ομάδα το διάστημα βγαίνει
 * ευρύτερο από την ίδια την επίδραση. Αυτό δεν είναι αποτυχία του
 * υπολογισμού, είναι το αποτέλεσμα — και φαίνεται.
 */
function line(r) {
  if (r.status === 'no-data') {
    return `${r.have} από ${r.need} απαντήσεις — χρειάζονται ${MIN_GROUP} σε κάθε ομάδα`
  }
  if (r.status === 'insufficient') {
    const small = Math.min(r.nA, r.nB)
    return small === 0
      ? `καμία μέρα «${r.nA === 0 ? r.labelA : r.labelB}» — χωρίς σύγκριση δεν βγαίνει νούμερο`
      : `${r.nA} / ${r.nB} — η μικρότερη ομάδα θέλει ${MIN_GROUP - small} ακόμα`
  }
  const spread = r.status === 'clustered'
    ? ` · προσοχή: ${r.spread.longestRun} από τις ${r.spread.distinctDays} μέρες της μικρής ομάδας είναι συνεχόμενες, μπορεί να μετράει «εκείνη την εβδομάδα» και όχι τη συνήθεια`
    : ''
  const zero = r.crossesZero
    ? ' · το διάστημα περνάει από το μηδέν, άρα δεν ξεχωρίζει από τον θόρυβο'
    : ''
  return `${r.nA} / ${r.nB} μέρες · ${kg(r.ciLow)} έως ${kg(r.ciHigh)}${zero}${spread}`
}

export default function InsightPanel({ insights = [] }) {
  if (insights.length === 0) return null
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.grid}`, padding: '16px 16px 14px' }}>
      <h2 style={{ fontSize: T.base, fontWeight: W.medium, margin: '0 0 3px' }}>Τι φαίνεται στα δεδομένα</h2>
      <p style={{ fontSize: T.xs, color: C.muted, margin: '0 0 14px', lineHeight: 1.4 }}>
        Σύγκριση πρωινού βάρους, με την τάση αφαιρεμένη. Δείχνει εύρος, όχι σίγουρο νούμερο.
      </p>

      {insights.map((r, i) => (
        <div key={r.id} style={{ paddingTop: i ? 11 : 0, marginTop: i ? 11 : 0, borderTop: i ? `1px solid ${C.grid}` : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: T.sm, color: C.ink }}>
              {r.labelA} <span style={{ color: C.muted }}>έναντι</span> {r.labelB}
            </div>
            <div style={{
              fontSize: T.base, fontWeight: W.medium, fontVariantNumeric: 'tabular-nums',
              color: r.status === 'ready' && !r.crossesZero ? C.ink : C.muted, whiteSpace: 'nowrap',
            }}>
              {r.status === 'ready' || r.status === 'clustered' ? kg(r.diff) : '—'}
            </div>
          </div>
          <div style={{ fontSize: T.xs, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>
            {line(r)}
            {r.threshold !== undefined && (r.status === 'ready' || r.status === 'clustered') &&
              ` · κόψιμο στη διάμεσο, ${formatAnswer(r.question, r.threshold)}`}
          </div>
        </div>
      ))}
    </section>
  )
}
