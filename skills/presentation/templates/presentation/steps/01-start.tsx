import type { Step } from '../../../presentation-kit';
import { EvolvingScene } from './Scene';
import type { SceneState } from './Scene';

export const step: Step<SceneState> = {
  id: 'start', era: 'beginning', title: 'Start here',
  caption: 'Describe this beat of the story.', groupKey: 'presentation-scene',
  Scene: EvolvingScene, payload: { label: 'Your subject' },
};
