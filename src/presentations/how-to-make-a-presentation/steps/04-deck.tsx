import type { Step } from '../../../presentation-kit';
import { EvolvingScene } from './Scene';
import type { SceneState } from './Scene';

export const step: Step<SceneState> = {
  "id": "deck",
  "era": "the gathering",
  "title": "The deck grows",
  "caption": "Same shapes, new beats. Every answer extends the story without redrawing it.",
  "groupKey": "making-a-presentation",
  Scene: EvolvingScene,
  payload: { beat: 4 },
};
