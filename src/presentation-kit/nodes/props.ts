import type { CSSProperties, HTMLAttributes } from 'react'

/** Position and size on the fixed design canvas. */
export interface Placement {
  x: number
  y: number
  w?: number
  h?: number
}

/** Props shared by every node primitive: stable identity plus style hooks. */
export interface NodeProps extends Omit<HTMLAttributes<HTMLElement>, 'id' | 'style' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  /** Stable entity id; used as the motion `layoutId` and as `data-presentation-id`. */
  id: string
  at?: Placement
  style?: CSSProperties
}

export function placementStyle(at: Placement | undefined, style: CSSProperties | undefined): CSSProperties | undefined {
  if (!at) return style
  return { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h, ...style }
}
