import type { ReactNode } from 'react'
import type { HTMLMotionProps } from 'motion/react'
import type { Rect } from '../types'

/** Props shared by every node primitive: identity plus class/style hooks. */
export type NodeProps<T extends 'div' | 'span' = 'div'> = Omit<
  HTMLMotionProps<T>,
  'layoutId' | 'ref' | 'children'
> & {
  children?: ReactNode
  /** Stable entity identity; equal ids in adjacent steps morph in place. */
  layoutId?: string
  /** Absolute placement in the design canvas. */
  at?: Rect
  /** Fade in after persisting entities settle (newcomers only). */
  appear?: boolean
  /** Free-form hook for presentation CSS, exposed as data-presentation-variant. */
  variant?: string
}
