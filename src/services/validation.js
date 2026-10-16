// Small, plain helper functions used to check user input before it is saved.
// They live in one file so the same checks are reused by the product and order
// services instead of being copied around.

// True when a value is a piece of text that is not empty or only spaces.
export function isNonEmptyText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

// True for numbers like 0, 12.5 or 300 (used for prices and totals).
export function isNumberAtLeastZero(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

// True for whole numbers like 0, 1 or 24 (used for stock and quantities).
export function isWholeNumber(value) {
  return Number.isInteger(value) && value >= 0
}

// Inputs always hand us text. Number('') is 0, which would silently turn an
// empty box into a zero, so empty text becomes NaN (not a number) instead and
// is then rejected by the checks above.
export function textToNumber(text) {
  return text.trim() === '' ? NaN : Number(text)
}
