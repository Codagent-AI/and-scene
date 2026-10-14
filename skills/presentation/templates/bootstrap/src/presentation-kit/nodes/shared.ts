import type { CSSProperties } from 'react'
import { hookAttrs, HOOK } from '../hooks'

/** Positional geometry in design-canvas pixels. Layout only. */
export interface Rect {
  x?: number
  y?: number
  width?: number
  height?: number
}

/** Identity and hook props shared by every node primitive. */
export interface NodeCommonProps {
  /** Stable identity. Same id across steps morphs in place via layoutId. */
  id?: string
  className?: string
  style?: CSSProperties
  /** Extra data attributes, e.g. { 'data-role': 'source' }. */
  data?: Record<string, string>
}

export function rectStyle({ x, y, width, height }: Rect): CSSProperties {
  return {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
  }
}

export function nodeAttrs(kind: string, id: string | undefined, data: Record<string, string> = {}) {
  return {
    ...hookAttrs(HOOK.node, kind),
    ...(id === undefined ? {} : hookAttrs(HOOK.nodeId, id)),
    ...data,
  }
}
