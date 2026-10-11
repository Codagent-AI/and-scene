import type { Step } from '../../../presentation-kit';
import { EvolvingScene } from './Scene';
import type { SceneState } from './Scene';

export const step: Step<SceneState> = {
  "id": "interview",
  "era": "the ask",
  "title": "The skill interviews you",
  "caption": "One question at a time: the topic, the look, then each beat of the story.",
  "groupKey": "making-a-presentation",
  Scene: EvolvingScene,
  payload: { beat: 2 },
};
