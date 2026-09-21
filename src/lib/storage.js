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

import { slotFromTime } from './date.js'

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

/**
 * Όρια προφίλ. Η οθόνη ρυθμίσεων τα διαβάζει για τα πεδία της, αλλά ο
 * περιορισμός γίνεται εδώ — ώστε καμία τιμή εκτός ορίων να μη φτάσει
 * ποτέ στους υπολογισμούς, από όποιο μονοπάτι κι αν έρθει.
 */
export const PROFILE_LIMITS = {
  age:          { min: 15,   max: 100,   step: 1 },
  height:       { min: 120,  max: 230,   step: 1 },
  targetIntake: { min: 1000, max: 5000,  step: 25 },
  steps:        { min: 0,    max: 50000, step: 100 },
}

function clamp(n, { min, max }) {
  return Math.min(max, Math.max(min, n))
}

export function sanitizeProfile(patch) {
  const out = {}
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'sex') {
      if (value === 'm' || value === 'f') out.sex = value
      continue
    }
    const limits = PROFILE_LIMITS[key]
    if (!limits) continue
    const n = Number(value)
    if (Number.isFinite(n)) out[key] = clamp(Math.round(n), limits)
  }
  return out
}

export function saveProfile(patch) {
  const next = { ...loadProfile(), ...sanitizeProfile(patch) }
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
 * Συνεχόμενα skip ανά ερώτηση, μετρημένα από την πιο πρόσφατη καταχώρηση
 * προς τα πίσω. Μία και μόνη απάντηση 'yes'/'no' μηδενίζει το σερί.
 *
 * Σκόπιμα ΟΧΙ άθροισμα όλου του ιστορικού: μια ερώτηση που την απαντάς
 * κανονικά αλλά την προσπερνάς πού και πού θα έφτανε το όριο μέσα σε έναν
 * χρόνο χρήσης και θα εξαφανιζόταν χωρίς λόγο.
 *
 * Ερώτηση που λείπει εντελώς από μια καταχώρηση (δεν τέθηκε ποτέ, ή έχει
 * ήδη αποσυρθεί) ούτε μετράει ούτε σπάει το σερί — απλά προσπερνιέται.
 */
export function skipStreaks(measurements) {
  const streaks = {}
  const broken = new Set()
  for (let i = measurements.length - 1; i >= 0; i--) {
    const answers = measurements[i].answers
    if (!answers) continue
    for (const [id, v] of Object.entries(answers)) {
      if (broken.has(id)) continue
      if (v === 'skip') streaks[id] = (streaks[id] || 0) + 1
      else broken.add(id)
    }
  }
  return streaks
}

/** Αντίγραφο ασφαλείας — σημαντικό, τα δεδομένα ζουν μόνο στο κινητό. */
export function exportJSON() {
  return JSON.stringify(
    { version: 1, exportedAt: Date.now(), profile: loadProfile(), measurements: loadMeasurements() },
    null, 2
  )
}

/**
 * Κανονικοποίηση μίας μέτρησης από αρχείο. Δέχεται και παλιά σχήματα:
 * ό,τι λείπει συμπληρώνεται, ό,τι περισσεύει πετιέται. Το `role` δεν
 * εφευρίσκεται εδώ — αν λείπει, το συμπεραίνει το withRoles() αργότερα.
 */
function normalize(m) {
  const out = {
    id: typeof m.id === 'string' && m.id ? m.id : `${m.t}-${Math.random().toString(36).slice(2, 7)}`,
    t: m.t,
    weight: +Number(m.weight).toFixed(2),
    slot: m.slot || slotFromTime(m.t),
    answers: m.answers && typeof m.answers === 'object' ? m.answers : {},
  }
  if (m.role === 'first' || m.role === 'other') out.role = m.role
  if (typeof m.steps === 'number' && Number.isFinite(m.steps)) out.steps = m.steps
  if (typeof m.refersTo === 'string') out.refersTo = m.refersTo
  return out
}

function isUsable(m) {
  return m && Number.isFinite(m.t) && Number.isFinite(Number(m.weight))
    && Number(m.weight) >= 25 && Number(m.weight) <= 400
}

/**
 * Διαβάζει αρχείο αντιγράφου χωρίς να αγγίξει τίποτα. Πετάει με μήνυμα
 * στα ελληνικά αν κάτι δεν στέκει — ο έλεγχος γίνεται ΠΡΙΝ δει ο χρήστης
 * κουμπί επαναφοράς, ώστε να μην μπορεί να σβήσει καλά δεδομένα με κακό αρχείο.
 */
export function parseBackup(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Το αρχείο δεν είναι έγκυρο JSON')
  }
  if (!data || !Array.isArray(data.measurements)) {
    throw new Error('Δεν βρέθηκε λίστα μετρήσεων στο αρχείο')
  }
  const measurements = data.measurements.filter(isUsable).map(normalize).sort((a, b) => a.t - b.t)
  if (measurements.length === 0) {
    throw new Error('Καμία έγκυρη μέτρηση στο αρχείο')
  }
  return {
    profile: data.profile && typeof data.profile === 'object' ? data.profile : null,
    measurements,
    from: measurements[0].t,
    to: measurements[measurements.length - 1].t,
  }
}

/**
 * Εφαρμογή αντιγράφου.
 *   'merge'   → κρατά ό,τι υπάρχει, προσθέτει μόνο ό,τι λείπει
 *   'replace' → αντικαθιστά τα πάντα
 * Η συγχώνευση αγνοεί διπλότυπα και κατά id και κατά timestamp — δύο
 * ζυγίσματα στο ίδιο χιλιοστό του δευτερολέπτου δεν υπάρχουν στην πράξη.
 */
export function applyBackup(parsed, mode = 'replace') {
  const incoming = parsed.measurements
  let next
  if (mode === 'merge') {
    const current = loadMeasurements()
    const ids = new Set(current.map((m) => m.id))
    const times = new Set(current.map((m) => m.t))
    const added = incoming.filter((m) => !ids.has(m.id) && !times.has(m.t))
    next = [...current, ...added].sort((a, b) => a.t - b.t)
  } else {
    next = incoming
  }
  write(KEY_M, next)
  if (parsed.profile) write(KEY_P, { ...DEFAULT_PROFILE, ...parsed.profile })
  return loadMeasurements()
}
