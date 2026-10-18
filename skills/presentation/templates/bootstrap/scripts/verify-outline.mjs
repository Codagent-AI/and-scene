/**
 * Canonical nine-step outline of the committed sample, written out independently of
 * the sample's own data. Titles and captions are normative.
 */
export const SAMPLE_SLUG = 'how-to-make-a-presentation'

export const EXPECTED_OUTLINE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  [
    'the ask',
    'The skill interviews you',
    'One question at a time: the topic, the look, then each beat of the story.',
  ],
  [
    'the gathering',
    'Answers become steps',
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  ],
  [
    'the gathering',
    'The deck grows',
    'Same shapes, new beats. Every answer extends the story without redrawing it.',
  ],
  [
    'the gathering',
    'You set the depth',
    'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  ],
  [
    'the build',
    'It assembles the scene',
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  ],
  [
    'the build',
    'It checks its own work',
    'Before saying done, it builds and renders every step — and fixes what breaks.',
  ],
  [
    'the loop',
    'Changed your mind? Loop it.',
    'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  ],
  [
    'the reveal',
    "You're looking at one",
    'This presentation was built exactly this way. Thanks for watching.',
  ],
].map(([era, title, caption]) => ({ era, title, caption }))

/**
 * Compares a registry and an outline against the canonical sample.
 * Returns a list of problems; an empty list means the sample matches.
 */
export function checkSample({ registry, outline, expected = EXPECTED_OUTLINE, slug = SAMPLE_SLUG }) {
  const problems = []
  if (!Array.isArray(registry) || !registry.some((entry) => entry?.slug === slug)) {
    problems.push(`sample "${slug}" is not registered`)
  }
  if (!Array.isArray(outline)) {
    problems.push('sample outline is missing')
    return problems
  }
  if (outline.length !== expected.length) {
    problems.push(`sample has ${outline.length} steps, expected ${expected.length}`)
  }
  expected.forEach((want, index) => {
    const got = outline[index]
    for (const field of ['era', 'title', 'caption']) {
      if (got?.[field] !== want[field]) {
        problems.push(
          `step ${index + 1} ${field}: expected ${JSON.stringify(want[field])}, found ${JSON.stringify(got?.[field])}`,
        )
      }
    }
  })
  return problems
}
