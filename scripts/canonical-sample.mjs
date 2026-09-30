// Canonical reference-sample identity and comparison used by scripts/verify.mjs
// to assert the committed sample matches the nine-step outline in
// openspec/changes/create-and-scene/specs/presentation-verification/spec.md.

export const CANONICAL_SLUG = 'how-to-make-a-presentation'

/**
 * Compares rendered { title, caption } pairs against the canonical outline,
 * in order, and returns a list of human-readable mismatch descriptions.
 */
export function findCanonicalMismatches(actualSteps, canonicalSteps) {
  const errors = []

  // The outline is exact: extra steps are as much a mismatch as missing ones.
  if (actualSteps.length !== canonicalSteps.length) {
    errors.push(
      `${CANONICAL_SLUG}: step count mismatch — expected ${canonicalSteps.length} canonical steps but found ${actualSteps.length}`,
    )
  }

  canonicalSteps.forEach((canonical, index) => {
    const actual = actualSteps[index]
    if (!actual) return
    if (actual.title !== canonical.title) {
      errors.push(
        `${CANONICAL_SLUG}: step ${index} title mismatch — expected "${canonical.title}" but found "${actual.title}"`,
      )
    }
    if (actual.caption !== canonical.caption) {
      errors.push(
        `${CANONICAL_SLUG}: step ${index} caption mismatch — expected "${canonical.caption}" but found "${actual.caption}"`,
      )
    }
  })

  return errors
}
