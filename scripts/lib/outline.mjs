// The normative nine-step outline of the committed reference sample.
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

/**
 * Compare the rendered steps (title/caption read from the DOM, in step order) with
 * the outline. Returns a list of problems; empty means it matches.
 */
export function validateOutline(actual, expected = SAMPLE_OUTLINE) {
  const problems = []
  if (actual.length !== expected.length) {
    problems.push({ index: Math.min(actual.length, expected.length), message: `expected ${expected.length} steps, found ${actual.length}` })
  }
  for (let i = 0; i < Math.min(actual.length, expected.length); i++) {
    for (const field of ['title', 'caption']) {
      if (actual[i]?.[field] !== expected[i][field]) {
        problems.push({ index: i, message: `${field} is ${JSON.stringify(actual[i]?.[field])}, expected ${JSON.stringify(expected[i][field])}` })
      }
    }
  }
  return problems
}

/** Reader-facing step label: 1-based like the progress lines and screenshot names, plus the 0-based hook index. */
export function describeStep(index, count) {
  return count ? `step ${index + 1} of ${count} (index ${index})` : `step ${index + 1} (index ${index})`
}
