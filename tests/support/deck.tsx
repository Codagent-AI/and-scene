import { useEffect } from 'react'
import type { SceneProps, Step } from '../../src/presentation-kit'

export const mounts = { scene: 0, unmounts: 0 }
export function resetMounts() {
  mounts.scene = 0
  mounts.unmounts = 0
}

export interface DeckPayload {
  label: string
}

export function CountingScene({ payload }: SceneProps<DeckPayload>) {
  useEffect(() => {
    mounts.scene++
    return () => {
      mounts.unmounts++
    }
  }, [])
  return <p data-testid="scene-payload">{payload.label}</p>
}

export function OtherScene({ payload }: SceneProps<DeckPayload>) {
  return <p data-testid="scene-payload">{payload.label}</p>
}

/** Six steps: a b c share a group; d is ungrouped; e f share another group (era repeats). */
export function makeDeck(): Step<DeckPayload>[] {
  const mk = (id: string, era: string, Scene: Step<DeckPayload>['Scene'], groupKey?: string): Step<DeckPayload> => ({
    id,
    era,
    title: `Title ${id}`,
    caption: `Caption ${id}`,
    Scene,
    groupKey,
    payload: { label: `payload ${id}` },
  })
  return [
    mk('a', 'one', CountingScene, 'g1'),
    mk('b', 'one', CountingScene, 'g1'),
    mk('c', 'two', CountingScene, 'g1'),
    mk('d', 'two', OtherScene),
    mk('e', 'three', OtherScene, 'g2'),
    mk('f', 'three', OtherScene, 'g2'),
  ]
}
