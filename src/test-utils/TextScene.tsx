import type { SceneProps } from '../presentation-kit'
import type { TestPayload } from './steps'

export function TextScene({ payload }: SceneProps<TestPayload>) {
  return <p data-testid="scene">{payload.label}</p>
}
