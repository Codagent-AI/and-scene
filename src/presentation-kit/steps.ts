import type { AnyStep } from './types.ts'

export interface Section {
  era: string
  /** Index of the first step in the section. */
  firstIndex: number
}

/** On-screen step number (1-based), derived from position. */
export const stepNumber = (index: number) => index + 1

/** Group consecutive steps by era label. */
export function sectionsOf(steps: readonly AnyStep[]): Section[] {
  const sections: Section[] = []
  steps.forEach((step, firstIndex) => {
    if (sections[sections.length - 1]?.era !== step.era) {
      sections.push({ era: step.era, firstIndex })
    }
  })
  return sections
}

/** Index into `sectionsOf` of the section containing `index`. */
export function sectionIndexOf(steps: readonly AnyStep[], index: number): number {
  const sections = sectionsOf(steps)
  let found = 0
  sections.forEach((section, i) => {
    if (section.firstIndex <= index) found = i
  })
  return found
}

export const clampIndex = (index: number, count: number) =>
  Math.max(0, Math.min(count - 1, index))
