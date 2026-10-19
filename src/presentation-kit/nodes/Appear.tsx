import type { HTMLAttributes } from 'react'
import { motion } from 'motion/react'
import { appearMotion } from './appear'

/** Wraps arbitrary content so it enters after persisting entities settle and exits on removal. */
export function Appear(props: HTMLAttributes<HTMLDivElement>) {
  const { style, ...rest } = props
  return (
    <motion.div
      data-presentation-appear=""
      {...appearMotion}
      style={style}
      {...(rest as Record<string, unknown>)}
    />
  )
}
