import type { SceneProps } from '../types.ts'

export interface TestPayload {
  n: number
}

export const TestScene = ({ payload }: SceneProps<TestPayload>) => (
  <div data-testid="scene">scene {payload.n}</div>
)
