export const sampleSlug = 'how-to-make-a-presentation'
export const sampleTitle = 'How to Use This Skill to Make a Presentation'

export const canonicalSteps = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

export function validateReferenceSample(registry, steps) {
  const registration = registry.find((entry) => entry.slug === sampleSlug)
  if (!registration || registration.title !== sampleTitle) {
    throw new Error(`reference sample registration is missing or malformed: /${sampleSlug}`)
  }
  for (let index = 0; index < canonicalSteps.length; index += 1) {
    const expected = canonicalSteps[index]
    const actual = steps[index]
    if (!actual || expected.some((value, valueIndex) => value !== actual[valueIndex])) {
      throw new Error(`reference sample step ${index + 1} is missing or out of canonical order`)
    }
  }
  if (steps.length !== canonicalSteps.length) {
    throw new Error(`reference sample must have ${canonicalSteps.length} steps; found ${steps.length}`)
  }
}
