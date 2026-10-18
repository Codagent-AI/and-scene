import type { CSSProperties } from 'react'
import { ENTER_T, EASE } from '../constants'

export type DataAttributes = { [key: `data-${string}`]: string | number | boolean | undefined }

/** Literal design-canvas rectangle, in canvas px. */
export interface Rect {
  x: number
  y: number
  w?: number
  h?: number
}

export interface NodeProps {
  /** Stable entity id; shared across steps so the entity morphs in place. */
  id: string
  className?: string
  style?: CSSProperties
  /** Absolute placement on the design canvas. */
  at?: Rect
  /** Marks the entity as emphasised (`data-presentation-emphasis`). */
  emphasis?: boolean
  /** Fade in when first mounted, after persisting entities settle. */
  appear?: boolean
}

export const EXIT = { opacity: 0, transition: { duration: ENTER_T, ease: EASE } } as const

export function rectStyle(at: Rect | undefined, style: CSSProperties | undefined): CSSProperties {
  if (!at) return { ...style }
  return {
    position: 'absolute',
    left: at.x,
    top: at.y,
    width: at.w,
    height: at.h,
    ...style,
  }
}

export function entityAttributes(id: string, node: string, emphasis: boolean | undefined) {
  return {
    'data-presentation-entity': id,
    'data-presentation-node': node,
    'data-presentation-emphasis': emphasis ? 'true' : undefined,
  }
}
