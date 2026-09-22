/**
 * Insight: σύγκριση δύο ομάδων ημερών με βάση μια ερώτηση.
 *
 * Επιστρέφει διαφορά και διάστημα εμπιστοσύνης — ποτέ ετυμηγορία. Με τα
 * μεγέθη δείγματος που μαζεύει ένα κινητό, η σωστή απάντηση είναι σχεδόν
 * πάντα «δεν ξεχωρίζει από τον θόρυβο», και αυτό πρέπει να φαίνεται.
 *
 * Δύο πύλες πριν βγει οτιδήποτε:
 *   1. min(nA, nB) >= MIN_GROUP — χρειάζονται ΚΑΙ ΟΙ ΔΥΟ ομάδες, όχι μόνο
 *      τα «ναι». (Το παλιό MIN_YES μετρούσε μόνο τη μία.)
 *   2. η μειοψηφική ομάδα να μην είναι μπλοκ συνεχόμενων ημερών — αλλιώς
 *      η «επίδραση» μπορεί κάλλιστα να είναι «εκείνη η εβδομάδα».
 */
import { dayKey } from './date.js'

export const MIN_GROUP = 8

// Εύρος του αμφίπλευρου πυρήνα, σε δείγματα. 3.0 σημαίνει ότι η τοπική
// βασική γραμμή κοιτάει περίπου ±1 εβδομάδα γύρω από κάθε μέτρηση.
export const SMOOTH_BANDWIDTH = 3.0

// Πόσο της μειοψηφικής ομάδας επιτρέπεται να είναι συνεχόμενες μέρες
// πριν θεωρηθεί μπλοκ αντί για δείγμα.
export const MAX_RUN_RATIO = 0.6

const T95 = [
  12.71, 4.30, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23,
  2.20, 2.18, 2.16, 2.14, 2.13, 2.12, 2.11, 2.10, 2.09, 2.09,
  2.08, 2.07, 2.07, 2.06, 2.06, 2.06, 2.05, 2.05, 2.05, 2.04,
]

function tCritical(df) {
  if (df < 1) return NaN
  return df <= T95.length ? T95[df - 1] : 1.96
}

/**
 * Αμφίπλευρος γκαουσιανός εξομαλυντής — η βασική γραμμή για τα υπόλοιπα.
 *
 * ΓΙΑΤΙ ΟΧΙ Η EWMA ΤΗΣ trend.js: εκείνη είναι αιτιακή, κοιτάει μόνο πίσω
 * και άρα υστερεί. Σε περίοδο πτώσης τα υπόλοιπά της βγαίνουν συστηματικά
 * θετικά στην αρχή και αρνητικά στο τέλος, οπότε κάθε μεταβλητή που
 * συσχετίζεται με τον χρόνο εμφανίζει ψεύτικη επίδραση. Εδώ η ανάλυση
 * είναι αναδρομική: έχουμε και τις δύο πλευρές κάθε σημείου, τις
 * χρησιμοποιούμε. Δεν είναι διπλή υλοποίηση του ίδιου πράγματος — είναι
 * άλλος εκτιμητής για άλλη δουλειά. Η trend.js μένει ως έχει.
 */
export function detrend(weights, bandwidth = SMOOTH_BANDWIDTH) {
  return weights.map((_, i) => {
    let num = 0
    let den = 0
    for (let j = 0; j < weights.length; j++) {
      const w = Math.exp(-0.5 * ((i - j) / bandwidth) ** 2)
      num += w * weights[j]
      den += w
    }
    return weights[i] - num / den
  })
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length

function variance(xs) {
  if (xs.length < 2) return NaN
  const m = mean(xs)
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)
}

export function median(xs) {
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Διαφορά μέσων με pooled τυπικό σφάλμα και 95% διάστημα. */
function compare(a, b) {
  const df = a.length + b.length - 2
  const sp = Math.sqrt(
    ((a.length - 1) * variance(a) + (b.length - 1) * variance(b)) / df
  )
  const se = sp * Math.sqrt(1 / a.length + 1 / b.length)
  const diff = mean(a) - mean(b)
  const margin = tCritical(df) * se
  return { diff, se, pooledSd: sp, ciLow: diff - margin, ciHigh: diff + margin }
}

/** Αριθμός ημέρας από κλειδί YYYY-MM-DD — μόνο για μέτρημα αποστάσεων. */
const dayIndex = (key) => Math.round(Date.parse(`${key}T00:00:00Z`) / 86400000)

/** Η μέρα που αφορά μια απάντηση: το χθες της μέτρησης. */
function answerDay(m) {
  return typeof m.refersTo === 'string' ? m.refersTo : dayKey(m.t - 86400000)
}

/**
 * Διασπορά μιας ομάδας μέσα στον χρόνο. Τρεις συνεχόμενες μέρες δεν είναι
 * τρία ανεξάρτητα δείγματα μιας συνήθειας — είναι ένα κομμάτι εβδομάδας.
 */
export function runAnalysis(dayKeys) {
  const days = [...new Set(dayKeys)].map(dayIndex).sort((a, b) => a - b)
  let longestRun = 1
  let current = 1
  for (let i = 1; i < days.length; i++) {
    current = days[i] === days[i - 1] + 1 ? current + 1 : 1
    if (current > longestRun) longestRun = current
  }
  return {
    longestRun,
    distinctDays: days.length,
    spanDays: days.length ? days[days.length - 1] - days[0] + 1 : 0,
    clustered: days.length > 0 && longestRun > Math.max(2, days.length * MAX_RUN_RATIO),
  }
}

const answered = (v) => v !== undefined && v !== null && v !== 'skip'

/**
 * @param {Array} entries μετρήσεις με `role` ήδη υπολογισμένο (withRoles)
 * @param {object} question αντικείμενο από το QUESTIONS
 */
export function computeInsight(entries, question) {
  const id = question.id
  const base = { id, question, labelA: question.labelA || 'Ναι', labelB: question.labelB || 'Όχι' }

  const first = entries.filter((m) => m.role === 'first').sort((a, b) => a.t - b.t)
  const usable = first.filter((m) => m.answers && answered(m.answers[id]))

  if (usable.length < 2 * MIN_GROUP) {
    return { ...base, status: 'no-data', nA: 0, nB: 0, have: usable.length, need: 2 * MIN_GROUP }
  }

  // Η βασική γραμμή υπολογίζεται σε ΟΛΕΣ τις 'first' μετρήσεις, όχι μόνο
  // σε όσες έχουν απάντηση — πρέπει να ξέρει και τις ενδιάμεσες μέρες.
  const residuals = detrend(first.map((m) => m.weight))
  const resById = new Map(first.map((m, i) => [m.id, residuals[i]]))

  let inA
  let threshold
  if (question.type === 'number') {
    threshold = median(usable.map((m) => Number(m.answers[id])))
    inA = (m) => Number(m.answers[id]) > threshold
  } else {
    inA = (m) => m.answers[id] === 'yes'
  }

  const A = usable.filter(inA)
  const B = usable.filter((m) => !inA(m))
  const result = { ...base, nA: A.length, nB: B.length, threshold }

  if (Math.min(A.length, B.length) < MIN_GROUP) {
    return { ...result, status: 'insufficient', need: MIN_GROUP }
  }

  const minority = A.length <= B.length ? A : B
  const spread = runAnalysis(minority.map(answerDay))
  const stats = compare(A.map((m) => resById.get(m.id)), B.map((m) => resById.get(m.id)))

  return {
    ...result,
    ...stats,
    spread,
    crossesZero: stats.ciLow <= 0 && stats.ciHigh >= 0,
    status: spread.clustered ? 'clustered' : 'ready',
  }
}

export function computeAllInsights(entries, questions) {
  return questions
    .filter((q) => q.insight !== false)
    .map((q) => computeInsight(entries, q))
}
