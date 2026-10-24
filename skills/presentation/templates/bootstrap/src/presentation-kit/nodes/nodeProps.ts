import type { CSSProperties, ReactNode } from 'react'

export interface NodeProps {
  /** Stable entity identity, used as the motion `layoutId` and the `data-presentation-entity` hook. */
  id: string
  /** Position and size on the design canvas (px). Omit to position with className/style. */
  x?: number
  y?: number
  width?: number
  height?: number
  className?: string
  style?: CSSProperties
  /** Author-defined state hook, exposed as `data-presentation-state`. */
  state?: string
  children?: ReactNode
}

/** Geometry-only inline style: absolute placement on the canvas, nothing visual. */
export function placement({ x, y, width, height, style }: NodeProps): CSSProperties {
  const positioned = x !== undefined || y !== undefined
  return {
    ...(positioned && { position: 'absolute' as const }),
    ...(x !== undefined && { left: x }),
    ...(y !== undefined && { top: y }),
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    ...style,
  }
}

export function hooks(kind: string, { id, state }: NodeProps) {
  return {
    'data-presentation-node': kind,
    'data-presentation-entity': id,
    'data-presentation-state': state,
  }
}
