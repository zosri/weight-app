/** Κλειδί ημέρας σε τοπική ώρα, YYYY-MM-DD. */
export function dayKey(ts = Date.now()) {
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Η προηγούμενη μέρα — οι ερωτήσεις της φάσης 4 αφορούν πάντα το χθες. */
export function previousDayKey(ts = Date.now()) {
  return dayKey(ts - 86400000)
}

/** Αυτόματος χαρακτηρισμός ζυγίσματος από την ώρα του συστήματος. */
export function slotFromTime(ts = Date.now()) {
  const h = new Date(ts).getHours()
  if (h < 11) return 'morning'
  if (h >= 17) return 'evening'
  return 'other'
}

export const SLOT_LABEL = { morning: 'πρωί', evening: 'βράδυ', other: 'ενδιάμεσο' }

export function formatDateTime(ts) {
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
}
