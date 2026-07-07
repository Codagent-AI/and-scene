import type { Step } from '../../presentation-kit'
import { ReferenceScene, type RefPayload } from './ReferenceScene'
import { REFERENCE_STEP_OUTLINE } from './outline'

const GROUP = 'reference-demo'

/**
 * What each beat adds to the one evolving scene. Payloads are cumulative on
 * purpose: a step is "the previous picture, plus one thing" — that continuity
 * is the whole trick this demo is teaching.
 */
const PAYLOADS: Record<(typeof REFERENCE_STEP_OUTLINE)[number]['id'], RefPayload> = {
  'you-have-a-topic': { bubble: true },
  'skill-interviews-you': { skill: true, question: 'what’s it about?' },
  'answers-become-steps': { skill: true, question: 'and step 1?', cards: 1 },
  'the-deck-grows': { skill: true, question: 'step 2… step 3?', cards: 3 },
  'you-set-the-depth': { skill: true, question: 'how deep?', cards: 3, ghost: true, depth: true },
  'assembles-the-scene': { skill: true, cards: 3, depth: true, route: true },
  'checks-its-work': { skill: true, cards: 3, depth: true, route: true, verify: true },
  'loop-it': {
    skill: true,
    question: 'change step 2?',
    cards: 3,
    depth: true,
    route: true,
    verify: true,
    loop: true,
  },
  reveal: { skill: true, cards: 3, depth: true, route: true, verify: true, reveal: true },
}

export const STEPS: Step<RefPayload>[] = REFERENCE_STEP_OUTLINE.map((step) => ({
  ...step,
  groupKey: GROUP,
  payload: PAYLOADS[step.id],
  Scene: ReferenceScene,
}))
