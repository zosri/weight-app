// Ένα σημείο για χρώματα και μεγέθη. Άλλαξε εδώ, αλλάζει παντού.
export const C = {
  paper:   '#E7EDF0',
  panel:   '#F3F7F9',
  ink:     '#16232E',
  muted:   '#4E6274',
  grid:    '#C3D2DB',
  trend:   '#155F5A',
  raw:     '#9C6F16',
  target:  '#8E2E24',
  evening: '#44578A',
}

// Κλίμακα γραμματοσειράς. Ανέβασε το SCALE αν τα θες ακόμη μεγαλύτερα.
const SCALE = 1

const px = (n) => `${Math.round(n * SCALE)}px`

export const T = {
  xs:    px(14),
  sm:    px(16),
  base:  px(18),
  lg:    px(21),
  xl:    px(28),
  huge:  px(40),
}

export const W = { normal: 500, medium: 600, bold: 700 }

export const FONT = "'Fira Sans', system-ui, -apple-system, sans-serif"
