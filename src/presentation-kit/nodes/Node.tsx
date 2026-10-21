import type { ReactNode, Ref } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { enterProps, exitProps } from './enter'

export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode
  /** Stable entity id; becomes the shared `layoutId` so the entity morphs between steps. */
  entity: string
  /** Fade in as a newcomer after persisting entities settle. */
  appear?: boolean
  ref?: Ref<HTMLDivElement>
}

/**
 * Shared base of the generic node primitives. It adds identity, layout projection,
 * and entrance/exit behavior — no visual styling. Geometry comes from `style`.
 */
export function Node({ entity, appear = false, kind, style, ...rest }: NodeProps & { kind: string }) {
  return (
    <motion.div
      layout
      layoutId={entity}
      data-presentation-node={kind}
      data-presentation-entity={entity}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...(appear ? enterProps : exitProps)}
      {...rest}
      style={{ position: 'absolute', ...style }}
    />
  )
}
