import type { SceneProps } from '../types.ts'
import type { TestPayload } from './testTypes.ts'

export function TestScene({ payload, stepIndex }: SceneProps<TestPayload>) {
  return (
    <div data-testid="scene" data-step-index-seen={stepIndex}>
      {payload.label}
    </div>
  )
}
