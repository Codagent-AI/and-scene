import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { dataProps, entityAttrs, type NodeProps } from './props.ts'

interface FrameProps extends NodeProps {
  children?: ReactNode
}

/** Grouping frame drawn around other entities; geometry comes from `style`. */
export function Frame({ id, className, style, children, ...rest }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={className}
      style={{ position: 'absolute', pointerEvents: 'none', ...style }}
      {...entityAttrs('frame', id)}
      {...dataProps(rest)}
    >
      {children}
    </motion.div>
  )
}
