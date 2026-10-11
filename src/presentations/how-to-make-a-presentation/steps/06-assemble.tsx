import type { Step } from '../../../presentation-kit';
import { EvolvingScene } from './Scene';
import type { SceneState } from './Scene';

export const step: Step<SceneState> = {
  "id": "assemble",
  "era": "the build",
  "title": "It assembles the scene",
  "caption": "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  "groupKey": "making-a-presentation",
  Scene: EvolvingScene,
  payload: { beat: 6 },
};
