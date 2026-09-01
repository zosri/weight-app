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
