// Pure data (no imports) so the verify script can load it directly and compare it with the normative outline.
export const OUTLINE = [
  { id: 'ask-topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.' },
  { id: 'ask-interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.' },
  { id: 'gather-steps', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.' },
  { id: 'gather-grows', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.' },
  { id: 'gather-depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.' },
  { id: 'build-assemble', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.' },
  { id: 'build-verify', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.' },
  { id: 'loop-modify', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.' },
  { id: 'reveal', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.' },
] as const
