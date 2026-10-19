import type { CSSProperties, HTMLAttributes } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { useEntrance } from '../entrance'

/** Author-facing props of a node element: plain HTML attributes plus style hooks. */
export type NodeHtmlProps<E extends HTMLElement> = Omit<
  HTMLAttributes<E>,
  'id' | 'style' | 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'
> & { style?: CSSProperties }

/** Optional literal canvas geometry shared by every node primitive. */
export interface Geometry {
  x?: number
  y?: number
  w?: number
  h?: number
}

export interface EntityOptions extends Geometry {
  /** Stable entity identity; doubles as the motion layoutId. */
  id: string
  kind: string
  style?: CSSProperties
  emphasis?: boolean
}

export function geometryStyle({ x, y, w, h }: Geometry): CSSProperties {
  const style: CSSProperties = {}
  if (x !== undefined || y !== undefined) style.position = 'absolute'
  if (x !== undefined) style.left = x
  if (y !== undefined) style.top = y
  if (w !== undefined) style.width = w
  if (h !== undefined) style.height = h
  return style
}

/**
 * Props shared by all entity elements: identity, hooks, geometry, layout
 * morph transition and entrance/exit. Author className/style/data pass through
 * the caller's own props.
 */
export function useEntityProps({ id, kind, style, emphasis, ...geometry }: EntityOptions) {
  const entrance = useEntrance(id)
  return {
    layoutId: id,
    ...entrance,
    transition: { layout: { duration: LAYOUT_T, ease: EASE } },
    'data-presentation-entity': id,
    'data-presentation-node': kind,
    ...(emphasis ? { 'data-presentation-emphasis': 'true' } : {}),
    style: { ...geometryStyle(geometry), ...style },
  }
}
