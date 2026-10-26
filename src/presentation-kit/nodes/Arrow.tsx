import { useId } from 'react'
import { motion } from 'motion/react'
import type { SVGMotionProps } from 'motion/react'
import { ENTER_T, LAYOUT_T } from '../constants'
export function Arrow({ id, d, bidirectional = false, ...props }: SVGMotionProps<SVGSVGElement> & { id: string; d: string; bidirectional?: boolean }) {
  const marker = useId().replace(/:/g, '')
  return <motion.svg layout layoutId={id} data-presentation-node="arrow" data-entity-id={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: LAYOUT_T, opacity: ENTER_T }} {...props}>
    <defs><marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
    <path d={d} fill="none" stroke="currentColor" markerEnd={`url(#${marker})`} markerStart={bidirectional ? `url(#${marker})` : undefined} />
  </motion.svg>
}
