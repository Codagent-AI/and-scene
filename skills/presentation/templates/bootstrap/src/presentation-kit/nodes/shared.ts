import type { CSSProperties, HTMLAttributes } from 'react'

/** Position of a node on the design canvas (layout geometry, not visual style). */
export interface Placement {
  x?: number
  y?: number
  w?: number
  h?: number
}

export interface NodeProps {
  /** Stable entity identity: used as the `layoutId` so the node morphs across steps. */
  id: string
  className?: string
  style?: CSSProperties
}

export type DomPassthrough = Omit<
  HTMLAttributes<HTMLElement>,
  'id' | 'className' | 'style' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>

/** Absolute placement inline style; caller `style` wins. */
export function placementStyle(p: Placement, style?: CSSProperties): CSSProperties {
  return {
    position: 'absolute',
    ...(p.x !== undefined && { left: p.x }),
    ...(p.y !== undefined && { top: p.y }),
    ...(p.w !== undefined && { width: p.w }),
    ...(p.h !== undefined && { height: p.h }),
    ...style,
  }
}
