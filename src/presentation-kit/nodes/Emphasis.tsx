import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { dataProps, entityAttrs, type NodeProps } from './props.ts'

interface EmphasisProps extends NodeProps {
  children?: ReactNode
}

/** Emphasis marker (flag, ring, highlight); the treatment is the presentation's CSS. */
export function Emphasis({ id, className, style, children, ...rest }: EmphasisProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={className}
      style={{ position: 'absolute', ...style }}
      {...entityAttrs('emphasis', id)}
      {...dataProps(rest)}
    >
      {children}
    </motion.span>
  )
}
