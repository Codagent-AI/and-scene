import type { Step } from '../../presentation-kit'
import { MainScene } from './MainScene'
import type { ScenePayload } from './MainScene'

/**
 * The nine canonical steps from
 * `openspec/changes/create-and-scene/specs/presentation-verification/spec.md`.
 * Titles and captions are normative and must stay verbatim and in order;
 * every step shares one `groupKey` so `MainScene` stays mounted the whole
 * talk and only its `payload.step` advances — nothing is ever redrawn.
 */
export const STEPS: Step<ScenePayload>[] = [
  {
    id: 'htmap-01',
    era: 'the ask',
    groupKey: 'htmap-scene',
    title: 'You have a topic',
    caption: 'It starts with you, a topic, and mild overconfidence.',
    payload: { step: 1 },
    Scene: MainScene,
  },
  {
    id: 'htmap-02',
    era: 'the ask',
    groupKey: 'htmap-scene',
    title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
    payload: { step: 2 },
    Scene: MainScene,
  },
  {
    id: 'htmap-03',
    era: 'the gathering',
    groupKey: 'htmap-scene',
    title: 'Answers become steps',
    caption:
      'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
    payload: { step: 3 },
    Scene: MainScene,
  },
  {
    id: 'htmap-04',
    era: 'the gathering',
    groupKey: 'htmap-scene',
    title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
    payload: { step: 4 },
    Scene: MainScene,
  },
  {
    id: 'htmap-05',
    era: 'the gathering',
    groupKey: 'htmap-scene',
    title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
    payload: { step: 5 },
    Scene: MainScene,
  },
  {
    id: 'htmap-06',
    era: 'the build',
    groupKey: 'htmap-scene',
    title: 'It assembles the scene',
    caption:
      'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
    payload: { step: 6 },
    Scene: MainScene,
  },
  {
    id: 'htmap-07',
    era: 'the build',
    groupKey: 'htmap-scene',
    title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
    payload: { step: 7 },
    Scene: MainScene,
  },
  {
    id: 'htmap-08',
    era: 'the loop',
    groupKey: 'htmap-scene',
    title: 'Changed your mind? Loop it.',
    caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
    payload: { step: 8 },
    Scene: MainScene,
  },
  {
    id: 'htmap-09',
    era: 'the reveal',
    groupKey: 'htmap-scene',
    title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
    payload: { step: 9 },
    Scene: MainScene,
  },
]
