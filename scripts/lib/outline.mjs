// The normative outline of the committed reference sample, and checks against it.

export const SAMPLE_SLUG = 'how-to-make-a-presentation'

export const SAMPLE_OUTLINE = [
  { era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.' },
  { era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.' },
  { era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.' },
  { era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.' },
  { era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.' },
  { era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.' },
  { era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.' },
  { era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.' },
  { era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.' },
]

/** Slugs declared in the source of `src/presentations/index.ts`. */
export function registeredSlugs(indexSource) {
  return [...indexSource.matchAll(/\bslug:\s*(['"`])([^'"`]+)\1/g)].map((m) => m[2])
}

/**
 * Checks that the reference sample is registered with a loader that imports
 * its own folder, and that the folder exists. Returns a list of problems.
 */
export function checkSampleRegistration(indexSource, { folderExists }) {
  const problems = []
  if (!folderExists) problems.push(`sample folder src/presentations/${SAMPLE_SLUG}/ is missing`)
  const entry = indexSource
    .split(/\n\s*\{/)
    .find((chunk) => new RegExp(`slug:\\s*['"\`]${SAMPLE_SLUG}['"\`]`).test(chunk))
  if (!entry) {
    problems.push(`sample "${SAMPLE_SLUG}" is not registered in src/presentations/index.ts`)
    return problems
  }
  if (!new RegExp(`load:\\s*\\(\\)\\s*=>\\s*import\\(\\s*['"\`]\\./${SAMPLE_SLUG}/[^'"\`]+['"\`]\\s*\\)`).test(entry)) {
    problems.push(`sample "${SAMPLE_SLUG}" has no loader importing ./${SAMPLE_SLUG}/…`)
  }
  return problems
}

/** Compares observed `{ era, title, caption }` steps with the outline, in order. */
export function compareOutline(observed, expected = SAMPLE_OUTLINE) {
  const problems = []
  if (observed.length !== expected.length) {
    problems.push(`expected ${expected.length} steps, found ${observed.length}`)
  }
  expected.forEach((want, index) => {
    const got = observed[index]
    if (!got) return
    for (const field of ['era', 'title', 'caption']) {
      if (got[field] !== want[field]) {
        problems.push(`step ${index}: ${field} is ${JSON.stringify(got[field])}, expected ${JSON.stringify(want[field])}`)
      }
    }
  })
  return problems
}
