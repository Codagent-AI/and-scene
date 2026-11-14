import { useId } from 'react'
import { motion } from 'motion/react'
import type { SVGMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'
export function Arrow({ id, d, both = false, ...props }: SVGMotionProps<SVGSVGElement> & { id: string; d: string; both?: boolean }) {
  const marker = useId().replace(/:/g, '')
  return <motion.svg layout layoutId={id} data-presentation-node="arrow" data-presentation-entity={id} transition={{ layout: LAYOUT_T }} {...props}>
    <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
    <motion.path d={d} fill="none" stroke="currentColor" markerEnd={`url(#${marker})`} markerStart={both ? `url(#${marker})` : undefined} />
  </motion.svg>
}
