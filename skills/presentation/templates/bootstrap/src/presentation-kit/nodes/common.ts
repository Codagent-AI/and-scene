import type { CSSProperties, HTMLAttributes } from 'react'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Hooks shared by every primitive: identity, optional canvas rect, and author class/style/data passthrough. */
export type NodeProps = Omit<HTMLAttributes<HTMLElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> & {
  /** Stable entity identity; becomes the Motion `layoutId`. */
  id: string
  /** Canvas-coordinate placement. Geometry only. */
  rect?: Rect
} & { [attr: `data-${string}`]: string | number | boolean | undefined }

export function rectStyle(rect: Rect | undefined, style: CSSProperties | undefined): CSSProperties | undefined {
  if (!rect) return style
  return { position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, ...style }
}
