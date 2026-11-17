export function validateCount(count, expected) {
  if (count !== expected.length) throw new Error('sample phase: expected nine reference steps')
}
export function validateStep(actual, expected, index) {
  if (!expected || actual.title !== expected.title || actual.caption !== expected.caption || actual.era !== expected.era) throw new Error(`sample phase step ${index}: normative title/caption/era mismatch`)
}
