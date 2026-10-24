import { motion } from 'motion/react'
import type { CSSProperties, SVGProps } from 'react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants.ts'
import { arrowPath } from './arrowPath.ts'
import type { ArrowGeometry } from './arrowPath.ts'

export interface ArrowProps
  extends ArrowGeometry,
    Omit<SVGProps<SVGSVGElement>, 'id' | 'from' | 'to' | 'ref' | 'style' | 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  id: string
  style?: CSSProperties
}

/** Stroke and head inherit `currentColor`; weight and colour are the author's. */
export function Arrow({ id, from, to, bidirectional, bend, head, style, ...rest }: ArrowProps) {
  const d = arrowPath({ from, to, bidirectional, bend, head })
  return (
    <motion.svg
      data-presentation-node="arrow"
      data-presentation-id={id}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      {...(rest as object)}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <motion.path d={d} initial={false} animate={{ d }} transition={{ duration: LAYOUT_T, ease: EASE }} />
    </motion.svg>
  )
}
