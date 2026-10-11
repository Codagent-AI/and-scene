import type { Step } from '../../../presentation-kit';
import { EvolvingScene } from './Scene';
import type { SceneState } from './Scene';

export const step: Step<SceneState> = {
  "id": "depth",
  "era": "the gathering",
  "title": "You set the depth",
  "caption": "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  "groupKey": "making-a-presentation",
  Scene: EvolvingScene,
  payload: { beat: 5 },
};
