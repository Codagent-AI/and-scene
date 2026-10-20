import { TestScene, type TestPayload } from './TestScene.tsx'
import type { Step } from '../types.ts'

export type { TestPayload }

/** Fixture steps spanning three eras with ids unrelated to position. */
export function makeSteps(eras: string[] = ['a', 'a', 'b', 'b', 'b', 'c']): Step<TestPayload>[] {
  return eras.map((era, i) => ({
    id: `id-${eras.length - i}`,
    era,
    title: `Title ${i}`,
    caption: `Caption ${i}`,
    groupKey: 'g',
    Scene: TestScene,
    payload: { n: i },
  }))
}
