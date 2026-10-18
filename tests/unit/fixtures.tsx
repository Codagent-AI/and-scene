import type { Step, SceneProps } from '../../src/presentation-kit'

export interface BeatPayload {
  beat: number
}

export function BeatScene({ payload }: SceneProps<BeatPayload>) {
  return <div data-testid="scene">beat {payload.beat}</div>
}

export function makeSteps(eras: string[], Scene = BeatScene, groupKey?: string): Step<BeatPayload>[] {
  return eras.map((era, i) => ({
    id: `s${i}`,
    era,
    title: `Title ${i}`,
    caption: `Caption ${i}`,
    Scene,
    groupKey,
    payload: { beat: i },
  }))
}

export function setViewport(width: number, height = 900) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}
