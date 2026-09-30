// Canonical nine-step outline for the committed reference sample, "How to Use
// This Skill to Make a Presentation" — see
// openspec/changes/create-and-scene/specs/presentation-verification/spec.md
// for the authoritative table this mirrors. Titles and captions are normative.

export const CANONICAL_STEPS = [
  {
    era: 'the ask',
    title: 'You have a topic',
    caption: 'It starts with you, a topic, and mild overconfidence.',
  },
  {
    era: 'the ask',
    title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
  },
  {
    era: 'the gathering',
    title: 'Answers become steps',
    caption:
      'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  },
  {
    era: 'the gathering',
    title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  },
  {
    era: 'the gathering',
    title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  },
  {
    era: 'the build',
    title: 'It assembles the scene',
    caption:
      'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  },
  {
    era: 'the build',
    title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  },
  {
    era: 'the loop',
    title: 'Changed your mind? Loop it.',
    caption:
      'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  },
  {
    era: 'the reveal',
    title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
  },
]

const FIELD_PATTERN = (field) =>
  new RegExp(`${field}:\\s*(?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)")`)

function unescape(value) {
  return value.replace(/\\(['"\\])/g, '$1')
}

function matchField(source, field) {
  const match = source.match(FIELD_PATTERN(field))
  if (!match) return null
  return unescape(match[1] ?? match[2])
}

export function extractStepMeta(source) {
  const era = matchField(source, 'era')
  const title = matchField(source, 'title')
  const caption = matchField(source, 'caption')
  if (era === null || title === null || caption === null) return null
  return { era, title, caption }
}

export function validateCanonicalOrder(stepMetas) {
  if (stepMetas.length !== CANONICAL_STEPS.length) {
    return {
      ok: false,
      message: `expected ${CANONICAL_STEPS.length} steps, got ${stepMetas.length}`,
    }
  }

  for (let index = 0; index < CANONICAL_STEPS.length; index += 1) {
    const expected = CANONICAL_STEPS[index]
    const actual = stepMetas[index]
    const stepNumber = index + 1

    if (!actual || actual.title !== expected.title) {
      return {
        ok: false,
        message: `step ${stepNumber}: expected title "${expected.title}", got "${actual?.title}"`,
      }
    }
    if (actual.era !== expected.era) {
      return {
        ok: false,
        message: `step ${stepNumber}: expected era "${expected.era}", got "${actual.era}"`,
      }
    }
    if (actual.caption !== expected.caption) {
      return {
        ok: false,
        message: `step ${stepNumber}: expected caption "${expected.caption}", got "${actual.caption}"`,
      }
    }
  }

  return { ok: true }
}
