// Pure validator for the committed reference sample's nine canonical steps.
// Kept fixture-specific (not part of the bootstrap template) since it
// encodes the normative title/caption/section text from
// openspec/changes/create-and-scene/specs/presentation-verification/spec.md.

export const CANONICAL_SAMPLE_SLUG = 'how-to-make-a-presentation'

export const CANONICAL_STEPS = [
  {
    section: 'the ask',
    title: 'You have a topic',
    caption: 'It starts with you, a topic, and mild overconfidence.',
  },
  {
    section: 'the ask',
    title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
  },
  {
    section: 'the gathering',
    title: 'Answers become steps',
    caption:
      'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  },
  {
    section: 'the gathering',
    title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  },
  {
    section: 'the gathering',
    title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  },
  {
    section: 'the build',
    title: 'It assembles the scene',
    caption:
      'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  },
  {
    section: 'the build',
    title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  },
  {
    section: 'the loop',
    title: 'Changed your mind? Loop it.',
    caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  },
  {
    section: 'the reveal',
    title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
  },
]

/**
 * Compares an ordered list of `{ section, title, caption }` step summaries
 * (read from the real, registered presentation's own steps — never a
 * hardcoded duplicate) against the normative nine-step outline.
 *
 * @param {Array<{ section?: string, title?: string, caption?: string }> | null | undefined} steps
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateCanonicalSteps(steps) {
  if (!Array.isArray(steps)) {
    return { ok: false, message: 'canonical sample steps are missing or not an array' }
  }

  if (steps.length !== CANONICAL_STEPS.length) {
    return {
      ok: false,
      message: `canonical sample must implement exactly ${CANONICAL_STEPS.length} steps, found ${steps.length}`,
    }
  }

  for (let index = 0; index < CANONICAL_STEPS.length; index += 1) {
    const expected = CANONICAL_STEPS[index]
    const actual = steps[index]
    const stepLabel = `step ${index + 1} ("${expected.title}")`

    if (!actual || actual.title !== expected.title) {
      return {
        ok: false,
        message: `step ${index + 1}: title mismatch — expected "${expected.title}", found "${actual?.title ?? '(missing)'}"`,
      }
    }
    if (actual.caption !== expected.caption) {
      return {
        ok: false,
        message: `${stepLabel}: caption mismatch — expected "${expected.caption}", found "${actual.caption ?? '(missing)'}"`,
      }
    }
    if (actual.section !== expected.section) {
      return {
        ok: false,
        message: `${stepLabel}: section mismatch — expected "${expected.section}", found "${actual.section ?? '(missing)'}"`,
      }
    }
  }

  return { ok: true }
}
