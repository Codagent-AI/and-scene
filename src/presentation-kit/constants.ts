import type { PresentationMode } from './types'

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.55, ease: EASE }
export const ENTER_T = 0.35
export const ENTER_DELAY = 0.58
export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.28
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
export const DEFAULT_ATTRIBUTION = { label: 'made by and-scene', href: ATTRIBUTION_HREF }

export const STAGE_LAYOUT: Record<PresentationMode, { reservedHeight: number; horizontalPadding: number }> = {
  browse: { reservedHeight: 190, horizontalPadding: 36 },
  present: { reservedHeight: 130, horizontalPadding: 28 },
}

// Public DOM hooks are consumed by verification, inspection, and presentation CSS.
export const PRESENTATION_HOOKS = {
  root: 'data-presentation-root', mode: 'data-presentation-mode', stage: 'data-presentation-stage',
  header: 'data-presentation-header', footer: 'data-presentation-footer', toc: 'data-presentation-toc',
  progress: 'data-presentation-progress', active: 'data-presentation-active', attribution: 'data-presentation-attribution',
} as const
