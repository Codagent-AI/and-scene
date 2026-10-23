import type { Step } from '../../../presentation-kit'
import { BEATS, type Beat } from '../beats'
import type { EntityId } from '../entities'
import type { SampleEntity, SampleState } from '../payload'
import { SampleScene } from '../SampleScene'

/** Every sample step shares one group and one scene, so the scene never remounts. */
const GROUP_KEY = 'scene'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Accumulates entities across beats: nothing introduced earlier is removed. */
export function buildSteps(beats: readonly Beat[] = BEATS): Step<SampleState>[] {
  const visible: EntityId[] = []
  const states: Partial<Record<EntityId, string>> = {}
  return beats.map((beat) => {
    for (const id of beat.enter) {
      if (!visible.includes(id)) visible.push(id)
    }
    Object.assign(states, beat.states)
    // Entry is decided by the scene from the previous step on screen, not stored here.
    const entities: SampleEntity[] = visible.map((id) => ({
      id,
      ...(states[id] === undefined ? {} : { state: states[id] }),
    }))
    return {
      id: slugify(beat.title),
      era: beat.era,
      title: beat.title,
      caption: beat.caption,
      Scene: SampleScene,
      groupKey: GROUP_KEY,
      payload: { entities },
    }
  })
}

export const STEPS: readonly Step<SampleState>[] = buildSteps()
