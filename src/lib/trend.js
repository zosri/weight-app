import { KCAL_PER_KG } from './metabolism.js'

export const ALPHA = 0.1

/**
 * Εκθετικά σταθμισμένος κινητός μέσος όρος.
 * Δέχεται σειρά { t, weight } ταξινομημένη χρονικά και
 * επιστρέφει την ίδια σειρά με πεδία ewma και n (πλήθος μετρήσεων
 * από την πρώτη καταχώρηση συνολικά — χρησιμοποιείται στη
 * διόρθωση εκκίνησης παρακάτω).
 */
export function ewma(points, alpha = ALPHA) {
  let acc = null
  return points.map((p, i) => {
    acc = acc === null ? p.weight : acc + alpha * (p.weight - acc)
    return { ...p, ewma: acc, n: i + 1 }
  })
}

/**
 * Διόρθωση εκκίνησης EWMA.
 * Το φίλτρο ξεκινά «κολλημένο» στην πρώτη μέτρηση, οπότε στις πρώτες
 * ~3 εβδομάδες η κλίση που βγάζει υποεκτιμά την πραγματική μεταβολή
 * βάρους — έως και 57%. Ο συντελεστής 1-(1-α)^n φτάνει το 1 (καμία
 * διόρθωση) γύρω στην 40ή μέρα χρήσης, όσο πιο «ζεσταμένο» είναι το φίλτρο.
 */
export function biasCorrection(n, alpha = ALPHA) {
  return 1 - Math.pow(1 - alpha, n)
}

/** Κλίση της τάσης σε kg ανά ημέρα, σε παράθυρο ημερών, διορθωμένη για την εκκίνηση. */
export function slopePerDay(points, windowDays = 14) {
  if (points.length < 2) return null
  const last = points[points.length - 1]
  const cutoff = last.t - windowDays * 86400000
  const first = points.find((p) => p.t >= cutoff)
  if (!first || first === last) return null
  const days = (last.t - first.t) / 86400000
  if (days < 1) return null
  const rawSlope = (last.ewma - first.ewma) / days
  return rawSlope / biasCorrection(last.n)
}

/** Θετικό = πλεόνασμα, αρνητικό = έλλειμμα. */
export function balanceFromSlope(slope) {
  return slope === null ? null : slope * KCAL_PER_KG
}
