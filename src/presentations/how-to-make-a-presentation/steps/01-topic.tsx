import type { Step } from '../../../presentation-kit';
import { EvolvingScene } from './Scene';
import type { SceneState } from './Scene';

export const step: Step<SceneState> = {
  ...{
  "id": "topic",
  "era": "the ask",
  "title": "You have a topic",
  "caption": "It starts with you, a topic, and mild overconfidence.",
  "groupKey": "making-a-presentation"
},
  Scene: EvolvingScene,
  payload: { beat: 1 },
};
