export const referenceSteps = [
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

export function validateReferenceOutline(source) {
  let cursor = -1
  const errors = []
  for (const [section, title, caption] of referenceSteps) {
    const positions = [section, title, caption].map((value) => source.indexOf(value, cursor + 1))
    if (positions.some((position) => position < 0) || positions.some((position, index) => index > 0 && position <= positions[index - 1])) {
      errors.push(`missing or out-of-order reference step: ${title}`)
    } else {
      cursor = positions[2]
    }
  }
  return errors
}

export function isValidStepCount(count) {
  return Number.isSafeInteger(count) && count > 0
}
