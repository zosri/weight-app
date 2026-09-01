// Όλοι οι μεταβολικοί τύποι σε ένα σημείο.

/** Βασικός μεταβολισμός, Mifflin-St Jeor. Επιστρέφει kcal/ημέρα. */
export function bmr({ weight, height, age, sex = 'm' }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return base + (sex === 'm' ? 5 : -161)
}

/**
 * Θερμίδες ανά βήμα. Κλιμακώνεται με το βάρος, οπότε
 * μειώνεται μόνη της καθώς χάνεις κιλά.
 */
export function kcalPerStep(weight) {
  return 0.0005 * weight
}

/**
 * Συνολική ημερήσια δαπάνη.
 * Ο συντελεστής 1.1 καλύπτει θερμογένεση τροφής και βασική κίνηση
 * χωρίς περπάτημα — τα βήματα προστίθενται ξεχωριστά ώστε να μη
 * μετρηθεί η δραστηριότητα δύο φορές.
 */
export function tdee({ weight, height, age, sex, steps = 0, baseFactor = 1.1 }) {
  return bmr({ weight, height, age, sex }) * baseFactor + steps * kcalPerStep(weight)
}

export const KCAL_PER_KG = 7700
