export const REFERENCE_SLUG = "how-to-make-a-presentation"
export const REFERENCE_TITLE = "How to Use This Skill to Make a Presentation"
export const REFERENCE = [
  {
    "era": "the ask",
    "title": "You have a topic",
    "caption": "It starts with you, a topic, and mild overconfidence."
  },
  {
    "era": "the ask",
    "title": "The skill interviews you",
    "caption": "One question at a time: the topic, the look, then each beat of the story."
  },
  {
    "era": "the gathering",
    "title": "Answers become steps",
    "caption": "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next."
  },
  {
    "era": "the gathering",
    "title": "The deck grows",
    "caption": "Same shapes, new beats. Every answer extends the story without redrawing it."
  },
  {
    "era": "the gathering",
    "title": "You set the depth",
    "caption": "Spell out every step, or sketch a few and see how it looks. You hold the gate."
  },
  {
    "era": "the build",
    "title": "It assembles the scene",
    "caption": "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph."
  },
  {
    "era": "the build",
    "title": "It checks its own work",
    "caption": "Before saying done, it builds and renders every step — and fixes what breaks."
  },
  {
    "era": "the loop",
    "title": "Changed your mind? Loop it.",
    "caption": "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch."
  },
  {
    "era": "the reveal",
    "title": "You're looking at one",
    "caption": "This presentation was built exactly this way. Thanks for watching."
  }
]
export function validateReference(actual) {
  if (actual.length !== REFERENCE.length) throw new Error(`Reference sample: expected 9 steps, received ${actual.length}`)
  for (let i = 0; i < REFERENCE.length; i++) for (const key of ['era', 'title', 'caption']) {
    if (actual[i][key] !== REFERENCE[i][key]) throw new Error(`Reference sample step ${i}: incorrect ${key}`)
  }
}
