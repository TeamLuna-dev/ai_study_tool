/**
 * shuffleArray.js
 * Pure utility: returns a new array with elements in random order.
 * Uses the Fisher-Yates algorithm — each element has an equal probability
 * of ending up in any position. Does not mutate the original array.
 *
 * @param {Array} array - the array to shuffle
 * @returns {Array} - a new shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
