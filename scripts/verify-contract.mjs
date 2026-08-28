export const canonicalSteps = [
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

export function validateReferenceSample(source) {
  const problems = []
  if (!source.includes("slug: 'how-to-make-a-presentation'")) problems.push('reference sample is not registered')
  let cursor = 0
  for (const [index, step] of canonicalSteps.entries()) {
    const era = source.indexOf(step.era, cursor)
    const title = source.indexOf(step.title, Math.max(era, cursor))
    const caption = source.indexOf(step.caption, Math.max(title, cursor))
    if (era < cursor || title < era || caption < title) {
      problems.push(`reference sample step ${index + 1} has an unexpected title or caption`)
    } else {
      cursor = caption + step.caption.length
    }
  }
  return problems
}
