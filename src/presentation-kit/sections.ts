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

/** Identity of the mounted scene: grouped steps share one, others get their own. */
export function sceneKey(step: { id: string; groupKey?: string }): string {
  return step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`
}
