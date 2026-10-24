import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

/** Props shared by every positioned node primitive. */
export interface NodeProps {
  /** Stable entity identity; becomes the `layoutId` that makes it morph. */
  id: string
  /** Position and size in design-canvas pixels. */
  x: number
  y: number
  w?: number
  h?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export const LAYOUT_TRANSITION = { duration: LAYOUT_T, ease: EASE }

export function boxStyle({ x, y, w, h, style }: NodeProps): CSSProperties {
  return { position: 'absolute', left: x, top: y, width: w, height: h, ...style }
}
