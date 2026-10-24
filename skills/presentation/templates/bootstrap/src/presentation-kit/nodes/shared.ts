import type { ComponentPropsWithoutRef, CSSProperties } from 'react'
import { EASE, LAYOUT_T } from '../constants.ts'

/** Optional absolute placement in design-canvas coordinates. */
export interface Placement {
  x?: number
  y?: number
  w?: number
  h?: number
}

export interface NodeBaseProps extends Placement {
  /** Stable entity identity; becomes the motion `layoutId` and `data-presentation-entity`. */
  id?: string
  className?: string
  style?: CSSProperties
}

export const LAYOUT_TRANSITION = { layout: { duration: LAYOUT_T, ease: EASE } }

/** Literal coordinates pass through unchanged; author `style` wins over placement. */
export function placementStyle(
  { x, y, w, h }: Placement,
  style?: CSSProperties,
): CSSProperties | undefined {
  const placed = x !== undefined || y !== undefined || w !== undefined || h !== undefined
  if (!placed) return style
  return { position: 'absolute', left: x, top: y, width: w, height: h, ...style }
}

/** Native div props a node accepts besides the ones the kit owns. */
export type DivProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'style' | 'className' | 'id' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'
>
