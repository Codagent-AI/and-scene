import type { SceneProps } from '../../../presentation-kit';
import { Box, SceneLayer } from '../../../presentation-kit';
import { entities } from '../entities';

export interface SceneState { label: string }
// Reuse this Scene and groupKey across beats; update payload rather than remounting.
export function EvolvingScene({ payload }: SceneProps<SceneState>) {
  return <SceneLayer><Box id={entities.subject} className="subject">{payload.label}</Box></SceneLayer>;
}
