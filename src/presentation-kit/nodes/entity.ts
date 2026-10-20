import type { ReactNode } from 'react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants.ts'

/** Props shared by the layout-animated primitives. `id` becomes the layoutId. */
export type EntityProps<T extends 'div' | 'span' = 'div'> = Omit<
  HTMLMotionProps<T>,
  'id' | 'layoutId' | 'layout' | 'children'
> & { id: string; children?: ReactNode }

export function entityAttrs(id: string, kind: string) {
  return {
    layout: true as const,
    layoutId: id,
    transition: LAYOUT_T,
    'data-presentation-entity': id,
    'data-presentation-node': kind,
  }
}
