import { Label, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit/types'
export function StarterScene({ payload }: SceneProps<{ label: string }>) {
  return <SceneLayer><Label layoutId="starter-label">{payload.label}</Label></SceneLayer>
}
