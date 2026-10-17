import { Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Placement } from '../../presentation-kit/nodes/props.ts'

/**
 * This presentation's `layoutId` namespace. An entity keeps its id (and, to morph
 * cleanly, its coordinates) across steps. `step` is the one-based step at which
 * the entity first appears; it stays on screen afterwards.
 */
export type EntityKind = 'box' | 'label' | 'chip' | 'frame' | 'emphasis' | 'arrow'

export interface Entity {
  id: string
  step: number
  kind: EntityKind
  /** Becomes the `ent-<role>` class that styles.css targets. */
  role: string
  at?: Placement
  from?: { x: number; y: number }
  to?: { x: number; y: number }
  text?: string
  Icon?: LucideIcon
}

// The canvas is 880 x 380 design pixels.
export const ENTITIES: readonly Entity[] = [
  { id: 'topic', step: 1, kind: 'box', role: 'topic', at: { x: 60, y: 140, w: 200, h: 80 }, text: 'topic', Icon: Sparkles },
  { id: 'result', step: 2, kind: 'box', role: 'result', at: { x: 620, y: 140, w: 200, h: 80 }, text: 'result' },
  { id: 'topic-result', step: 2, kind: 'arrow', role: 'link', from: { x: 264, y: 180 }, to: { x: 616, y: 180 } },
]

export const visibleAt = (stepIndex: number) => ENTITIES.filter((e) => e.step <= stepIndex + 1)
