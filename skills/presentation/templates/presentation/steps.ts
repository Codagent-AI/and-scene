import type { Step } from '../../presentation-kit'
import { BEATS } from './beats'
import type { EntityId } from './entities'
import { Scene } from './Scene'
import type { SceneEntity, SceneState } from './payload'

const GROUP_KEY = 'scene'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Accumulates entities across beats so nothing introduced earlier is removed. */
export function buildSteps(): Step<SceneState>[] {
  const visible: EntityId[] = []
  return BEATS.map((beat) => {
    for (const id of beat.enter) {
      if (!visible.includes(id)) visible.push(id)
    }
    // Entry is decided by the scene from the previous step on screen, not stored here.
    const entities: SceneEntity[] = visible.map((id) => ({ id }))
    return {
      id: slugify(beat.title),
      era: beat.era,
      title: beat.title,
      caption: beat.caption,
      Scene,
      groupKey: GROUP_KEY,
      payload: { entities },
    }
  })
}

export const STEPS: readonly Step<SceneState>[] = buildSteps()
