import type { CSSProperties } from 'react'
import { ENTER_T } from '../constants'

/** Absolute placement inside the design canvas, in canvas pixels. */
export interface Placement {
  x: number
  y: number
  w?: number
  h?: number
}

export function placementStyle(at?: Placement): CSSProperties | undefined {
  if (!at) return undefined
  return { position: 'absolute', left: at.x, top: at.y, width: at.w, height: at.h }
}

/** Departing entities fade out when their layer is an AnimatePresence boundary. */
export const EXIT = { opacity: 0, transition: { duration: ENTER_T / 2 } } as const
