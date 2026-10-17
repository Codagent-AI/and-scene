import type { Section } from './types.ts'

/** One section per maximal run of consecutive steps sharing an era label. */
export function buildSections(steps: ReadonlyArray<{ era: string }>): Section[] {
  const sections: Section[] = []
  steps.forEach((step, index) => {
    const last = sections[sections.length - 1]
    if (last && last.era === step.era) last.lastIndex = index
    else sections.push({ era: step.era, firstIndex: index, lastIndex: index })
  })
  return sections
}

export function formatMarker(index: number): string {
  return String(index + 1).padStart(2, '0')
}

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 1

/** Identity of the mounted scene: grouped steps sharing a Scene component share it; anything else gets its own. */
export function sceneKey(step: { id: string; groupKey?: string; Scene: object }): string {
  let sceneId = sceneIds.get(step.Scene)
  if (sceneId === undefined) {
    sceneId = nextSceneId++
    sceneIds.set(step.Scene, sceneId)
  }
  return step.groupKey ? `group:${step.groupKey}:${sceneId}` : `step:${step.id}`
}
