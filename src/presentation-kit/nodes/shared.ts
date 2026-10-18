import type { CSSProperties } from 'react'
import { EXIT_T, MOTION_LAYOUT } from '../constants'

/** Literal canvas coordinates in design-canvas pixels. */
export interface At {
  x: number
  y: number
  w?: number
  h?: number
}

export interface NodeHooks {
  /** Stable entity identity; becomes the motion `layoutId`. */
  id: string
  className?: string
  style?: CSSProperties
}

export function atStyle(at: At | undefined, style: CSSProperties | undefined): CSSProperties {
  if (!at) return { ...style }
  return { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h, ...style }
}

export const entityMotion = {
  layout: true,
  transition: { layout: MOTION_LAYOUT },
  exit: { opacity: 0, transition: { duration: EXIT_T } },
} as const
