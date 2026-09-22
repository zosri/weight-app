/**
 * Ρόλος ζυγίσματος.
 *
 * Μόνο το πρώτο ζύγισμα της ημέρας τρέφει την τάση.
 *
 * ΔΙΟΡΘΩΣΗ 21/9/2026: εδώ έγραφε ότι το βραδινό είναι συστηματικά 0.5-1
 * κιλό πάνω από το πρωινό. Στα πραγματικά δεδομένα (6 ζεύγη πρωί/βράδυ
 * του Σεπτεμβρίου) ο μέσος όρος της διαφοράς είναι ουσιαστικά μηδέν —
 * η υπόθεση ήταν αστήρικτη. Ο διαχωρισμός στέκει για άλλον λόγο, που
 * ισχύει: η *διασπορά* του βραδινού είναι πολύ μεγαλύτερη, οπότε αν μπει
 * στην ίδια σειρά EWMA κουνάει την τάση ανάλογα με το *πότε έτυχε* να
 * ζυγιστείς — θόρυβος συγκρίσιμος με το σήμα όταν περιμένεις 0.3 κιλά
 * την εβδομάδα.
 *
 *   role = 'first'  → μπαίνει στην τάση
 *   role = 'other'  → μένει ως κουκκίδα, πρώτη ύλη για το γράφημα διαφοράς
 *
 * Το πεδίο γράφεται πλέον ρητά κατά την καταχώρηση. Για τις παλιές
 * μετρήσεις που δεν το έχουν, συμπεραίνεται εδώ — και επίτηδες ΟΧΙ από
 * το `slot` σκέτο: το `slot` βγαίνει από το ρολόι, οπότε ένα ζύγισμα
 * «πρώτο της ημέρας» στις 12:30 ένα Σάββατο θα χανόταν.
 */
import { dayKey } from './date.js'

export function hasSteps(m) {
  return typeof m.steps === 'number' && Number.isFinite(m.steps)
}

export function hasAnswers(m) {
  return !!m.answers && Object.keys(m.answers).length > 0
}

/** Το πιο πρώιμο timestamp ανά ημέρα (τοπική ώρα). */
function earliestPerDay(measurements) {
  const map = new Map()
  for (const m of measurements) {
    const k = dayKey(m.t)
    const cur = map.get(k)
    if (cur === undefined || m.t < cur) map.set(k, m.t)
  }
  return map
}

/**
 * Επιστρέφει τη σειρά με εγγυημένο πεδίο `role`.
 * Ρητό πεδίο από την καταχώρηση υπερισχύει πάντα του συμπερασμού.
 */
export function withRoles(measurements) {
  const earliest = earliestPerDay(measurements)
  return measurements.map((m) => {
    if (m.role === 'first' || m.role === 'other') return m
    const isEarliest = earliest.get(dayKey(m.t)) === m.t
    // Παλιά δεδομένα: πρώτο της ημέρας ΚΑΙ (πρωινή ώρα Ή πήρε βήματα/ερωτήσεις,
    // που γίνεται μόνο στη ροή «πρώτη μέτρηση της ημέρας»).
    const inferredFirst = isEarliest && (m.slot === 'morning' || hasSteps(m) || hasAnswers(m))
    return { ...m, role: inferredFirst ? 'first' : 'other' }
  })
}
