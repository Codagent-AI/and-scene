import type { Step } from '../../../presentation-kit';
import { EvolvingScene } from './Scene';
import type { SceneState } from './Scene';

export const step: Step<SceneState> = {
  ...{
  "id": "modify",
  "era": "the loop",
  "title": "Changed your mind? Loop it.",
  "caption": "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  "groupKey": "making-a-presentation"
},
  Scene: EvolvingScene,
  payload: { beat: 8 },
};
