// Normative nine-step outline of the committed reference presentation.
export const REFERENCE_SLUG = 'how-to-make-a-presentation'

export const REFERENCE_OUTLINE = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
].map(([title, caption]) => ({ title, caption }))

/** Returns a description of the first mismatch against the outline, or null. */
export function compareOutline(observed, expected = REFERENCE_OUTLINE) {
  if (observed.length !== expected.length) {
    return `expected ${expected.length} steps, found ${observed.length}`
  }
  for (let i = 0; i < expected.length; i++) {
    for (const field of ['title', 'caption']) {
      if (observed[i]?.[field] !== expected[i][field]) {
        return `step ${i + 1} ${field}: expected ${JSON.stringify(expected[i][field])}, got ${JSON.stringify(observed[i]?.[field])}`
      }
    }
  }
  return null
}
