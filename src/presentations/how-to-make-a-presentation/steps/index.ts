import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from '../Scene'

/** One grouped scene instance: each step only raises `beat`, so nothing already drawn is redrawn. */
const step = (beat: ScenePayload['beat'], s: Omit<Step<ScenePayload>, 'groupKey' | 'Scene' | 'payload'>): Step<ScenePayload> => ({
  ...s,
  groupKey: 'route',
  Scene,
  payload: { beat },
})

export const STEPS: readonly Step<ScenePayload>[] = [
  step(1, {
    id: 'topic',
    era: 'the ask',
    title: 'You have a topic',
    caption: 'It starts with you, a topic, and mild overconfidence.',
  }),
  step(2, {
    id: 'interview',
    era: 'the ask',
    title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
  }),
  step(3, {
    id: 'answers',
    era: 'the gathering',
    title: 'Answers become steps',
    caption:
      'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  }),
  step(4, {
    id: 'deck-grows',
    era: 'the gathering',
    title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  }),
  step(5, {
    id: 'depth',
    era: 'the gathering',
    title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  }),
  step(6, {
    id: 'assembles',
    era: 'the build',
    title: 'It assembles the scene',
    caption:
      'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  }),
  step(7, {
    id: 'checks',
    era: 'the build',
    title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  }),
  step(8, {
    id: 'loop',
    era: 'the loop',
    title: 'Changed your mind? Loop it.',
    caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  }),
  step(9, {
    id: 'reveal',
    era: 'the reveal',
    title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
  }),
]
