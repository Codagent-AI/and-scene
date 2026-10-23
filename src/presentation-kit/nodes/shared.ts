import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'

/** Props shared by every positioned diagram node. Coordinates are design-canvas units. */
export interface NodeBase {
  /** Stable identity: becomes the entity hook and the Motion layoutId. */
  id: string
  x: number
  y: number
  width: number
  height: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
  /** Marks this node as an intentional, readable overlap so inspection skips it. */
  allowOverlap?: boolean
  /** Consumer data attributes are forwarded; kit hooks are applied after them and win. */
  [hook: `data-${string}`]: string | undefined
}

/** Picks the consumer's data-* attributes out of rest props. */
export function dataProps(rest: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(rest).filter(([key, value]) => key.startsWith('data-') && typeof value === 'string'),
  ) as Record<string, string>
}

/** Identity, morph, and exit attributes common to every primitive. */
export function entityProps(id: string, allowOverlap?: boolean) {
  return {
    layoutId: id,
    'data-presentation-entity': id,
    'data-presentation-allow-overlap': allowOverlap ? '' : undefined,
    exit: { opacity: 0 },
    transition: { layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: LAYOUT_T } },
  } as const
}
