import { Label, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit/types'
export function ExampleScene({ payload }: SceneProps<{ label: string }>) {
  return <SceneLayer><Label layoutId="example-label">{payload.label}</Label></SceneLayer>
}
