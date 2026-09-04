/**
 * Αποθήκευση στο κινητό. localStorage προς το παρόν — αρκεί άνετα για
 * μερικές χιλιάδες μετρήσεις. Όλη η πρόσβαση περνά από εδώ, οπότε η
 * μετάβαση σε IndexedDB αργότερα δεν αγγίζει τίποτα άλλο.
 *
 * Σχήμα μέτρησης:
 *   { id, t, weight, slot, refersTo, answers }
 *   t        = χρόνος συστήματος σε ms
 *   refersTo = η μέρα που αφορούν οι απαντήσεις (χθες), για τη φάση 4
 */

const KEY_M = 'wa.measurements.v1'
const KEY_P = 'wa.profile.v1'

export const DEFAULT_PROFILE = {
  age: 44,
  sex: 'm',
  height: 165,
  targetIntake: 1575,
  steps: 3000,          // σταθερή τιμή μέχρι να συνδεθεί το Health Connect
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadProfile() {
  return { ...DEFAULT_PROFILE, ...read(KEY_P, {}) }
}

export function saveProfile(patch) {
  const next = { ...loadProfile(), ...patch }
  write(KEY_P, next)
  return next
}

/** Πάντα ταξινομημένες χρονικά. */
export function loadMeasurements() {
  return read(KEY_M, []).sort((a, b) => a.t - b.t)
}

export function addMeasurement(m) {
  const all = loadMeasurements()
  all.push({ id: `${m.t}-${Math.random().toString(36).slice(2, 7)}`, answers: {}, ...m })
  all.sort((a, b) => a.t - b.t)
  write(KEY_M, all)
  return all
}

export function deleteMeasurement(id) {
  const all = loadMeasurements().filter((m) => m.id !== id)
  write(KEY_M, all)
  return all
}

/**
 * Μέσος όρος βημάτων από τις τελευταίες πραγματικές καταχωρήσεις
 * (πεδίο `steps`, γράφεται μόνο στο πρωινό ζύγισμα, αφορά το χθες).
 * Παραλειπόμενες μέρες δεν μπαίνουν καθόλου στον μέσο όρο — δεν
 * μετράνε σαν 0, απλά δεν υπάρχουν. Χωρίς καμία καταχώρηση,
 * γυρνά στη σταθερή τιμή του προφίλ.
 */
export function estimateSteps(measurements, profile, days = 7) {
  const withSteps = measurements
    .filter((m) => typeof m.steps === 'number' && Number.isFinite(m.steps))
    .slice(-days)
  if (withSteps.length === 0) return { value: profile.steps, real: false, samples: 0 }
  const avg = withSteps.reduce((s, m) => s + m.steps, 0) / withSteps.length
  return { value: Math.round(avg), real: true, samples: withSteps.length }
}

/**
 * Πλήθος skip ανά ερώτηση, σε όλο το ιστορικό. Χρησιμοποιείται για
 * να αποσυρθεί μια ερώτηση μετά το όριο (βλ. MAX_SKIPS στο questions.js) —
 * το skip καταγράφεται ρητά ως 'skip', ποτέ δεν συγχέεται με 'no'.
 */
export function skipCounts(measurements) {
  const counts = {}
  for (const m of measurements) {
    if (!m.answers) continue
    for (const [id, v] of Object.entries(m.answers)) {
      if (v === 'skip') counts[id] = (counts[id] || 0) + 1
    }
  }
  return counts
}

/** Αντίγραφο ασφαλείας — σημαντικό, τα δεδομένα ζουν μόνο στο κινητό. */
export function exportJSON() {
  return JSON.stringify(
    { version: 1, exportedAt: Date.now(), profile: loadProfile(), measurements: loadMeasurements() },
    null, 2
  )
}

export function importJSON(text) {
  const data = JSON.parse(text)
  if (!Array.isArray(data.measurements)) throw new Error('Μη έγκυρο αρχείο')
  write(KEY_M, data.measurements)
  if (data.profile) write(KEY_P, data.profile)
  return loadMeasurements()
}
