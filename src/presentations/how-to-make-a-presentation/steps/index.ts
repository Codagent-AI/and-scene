import type { Step } from '../../../presentation-kit'
import { presentAt } from '../entities'
import { TalkScene, type TalkPayload } from './Scene'

const GROUP = 'how-to-make-a-presentation'

function step(
  n: number,
  id: string,
  era: string,
  title: string,
  caption: string,
  emphasized: TalkPayload['emphasized'] = [],
): Step<TalkPayload> {
  return {
    id,
    era,
    title,
    caption,
    groupKey: GROUP,
    Scene: TalkScene,
    payload: { present: presentAt(n - 1), emphasized },
  }
}

export const STEPS: Step<TalkPayload>[] = [
  step(1, 'topic', 'the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'),
  step(
    2,
    'interview',
    'the ask',
    'The skill interviews you',
    'One question at a time: the topic, the look, then each beat of the story.',
  ),
  step(
    3,
    'answers-become-steps',
    'the gathering',
    'Answers become steps',
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  ),
  step(
    4,
    'deck-grows',
    'the gathering',
    'The deck grows',
    'Same shapes, new beats. Every answer extends the story without redrawing it.',
  ),
  step(
    5,
    'depth',
    'the gathering',
    'You set the depth',
    'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  ),
  step(
    6,
    'assembles',
    'the build',
    'It assembles the scene',
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  ),
  step(
    7,
    'checks',
    'the build',
    'It checks its own work',
    'Before saying done, it builds and renders every step — and fixes what breaks.',
  ),
  step(
    8,
    'loop',
    'the loop',
    'Changed your mind? Loop it.',
    'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
    ['card-3'],
  ),
  step(
    9,
    'reveal',
    'the reveal',
    "You're looking at one",
    'This presentation was built exactly this way. Thanks for watching.',
    ['card-3'],
  ),
]
