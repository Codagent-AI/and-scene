import { useEffect, type ComponentType } from 'react'
import type { Step, SceneProps } from '../../src/presentation-kit'

/** Counts mounts of a scene instance so tests can see remounts. */
export const mounts = { count: 0 }

export function CountingScene({ payload }: SceneProps<string>) {
  useEffect(() => {
    mounts.count += 1
  }, [])
  return <div data-testid="scene" data-payload={payload} />
}

export function makeSteps(extra: Partial<Step<string>> = {}): Step<string>[] {
  const Scene: ComponentType<SceneProps<string>> = CountingScene
  return [
    { id: 'a', era: 'first era', title: 'Alpha', caption: 'Caption alpha.', Scene, payload: 'a', ...extra },
    { id: 'b', era: 'first era', title: 'Beta', caption: 'Caption beta.', Scene, payload: 'b', ...extra },
    { id: 'c', era: 'second era', title: 'Gamma', caption: 'Caption gamma.', Scene, payload: 'c', ...extra },
    { id: 'd', era: 'second era', title: 'Delta', caption: 'Caption delta.', Scene, payload: 'd', ...extra },
  ]
}

/** Installs a matchMedia stub: the wide query matches when `wide` is true. */
export function stubMatchMedia(wide: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('min-width') ? wide : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
