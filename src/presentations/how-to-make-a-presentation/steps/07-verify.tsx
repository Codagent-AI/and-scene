import type { Step } from '../../../presentation-kit';
import { EvolvingScene } from './Scene';
import type { SceneState } from './Scene';

export const step: Step<SceneState> = {
  ...{
  "id": "verify",
  "era": "the build",
  "title": "It checks its own work",
  "caption": "Before saying done, it builds and renders every step — and fixes what breaks.",
  "groupKey": "making-a-presentation"
},
  Scene: EvolvingScene,
  payload: { beat: 7 },
};
