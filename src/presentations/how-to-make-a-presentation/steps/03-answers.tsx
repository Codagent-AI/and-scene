import type { Step } from '../../../presentation-kit';
import { EvolvingScene } from './Scene';
import type { SceneState } from './Scene';

export const step: Step<SceneState> = {
  ...{
  "id": "answers",
  "era": "the gathering",
  "title": "Answers become steps",
  "caption": "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  "groupKey": "making-a-presentation"
},
  Scene: EvolvingScene,
  payload: { beat: 3 },
};
