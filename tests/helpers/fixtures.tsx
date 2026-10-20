import type { SceneProps, Step } from '../../src/presentation-kit/index.ts'

export interface Payload {
  label: string
}

export function TextScene({ payload }: SceneProps<Payload>) {
  return <div data-testid="scene">{payload.label}</div>
}

export function makeSteps(n: number, eras: string[] = []): Step<Payload>[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i + 1}`,
    era: eras[i] ?? (i < 2 ? 'first era' : 'second era'),
    title: `Title ${i + 1}`,
    caption: `Caption ${i + 1}`,
    groupKey: 'g',
    Scene: TextScene,
    payload: { label: `state ${i + 1}` },
  }))
}
