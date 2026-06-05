import type { StepMeta } from '../types'

export interface Section {
  era: string
  start: number
  end: number
}

/** Collapse consecutive steps that share an era into one contents section. */
export function toSections(steps: StepMeta[]): Section[] {
  const out: Section[] = []
  steps.forEach((s, i) => {
    const last = out[out.length - 1]
    if (last && last.era === s.era) last.end = i
    else out.push({ era: s.era, start: i, end: i })
  })
  return out
}
