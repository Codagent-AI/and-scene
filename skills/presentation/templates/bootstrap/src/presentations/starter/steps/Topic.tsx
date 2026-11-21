import { Label, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities } from '../entities'

export interface Payload {
  label: string
}

export function Topic({ payload }: SceneProps<Payload>) {
  return <SceneLayer>
    <Label id={entities.topic} style={{ position: 'absolute', left: 80, top: 130 }}>
      {payload.label}
    </Label>
  </SceneLayer>
}
