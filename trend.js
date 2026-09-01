import { KCAL_PER_KG } from './metabolism.js'

export const ALPHA = 0.1

/**
 * Εκθετικά σταθμισμένος κινητός μέσος όρος.
 * Δέχεται σειρά { t, weight } ταξινομημένη χρονικά και
 * επιστρέφει την ίδια σειρά με πεδίο ewma.
 */
export function ewma(points, alpha = ALPHA) {
  let acc = null
  return points.map((p) => {
    acc = acc === null ? p.weight : acc + alpha * (p.weight - acc)
    return { ...p, ewma: acc }
  })
}

/** Κλίση της τάσης σε kg ανά ημέρα, σε παράθυρο ημερών. */
export function slopePerDay(points, windowDays = 14) {
  if (points.length < 2) return null
  const last = points[points.length - 1]
  const cutoff = last.t - windowDays * 86400000
  const first = points.find((p) => p.t >= cutoff)
  if (!first || first === last) return null
  const days = (last.t - first.t) / 86400000
  if (days < 1) return null
  return (last.ewma - first.ewma) / days
}

/** Θετικό = πλεόνασμα, αρνητικό = έλλειμμα. */
export function balanceFromSlope(slope) {
  return slope === null ? null : slope * KCAL_PER_KG
}
