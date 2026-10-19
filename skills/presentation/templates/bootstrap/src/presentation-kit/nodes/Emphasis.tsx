import { motion } from 'motion/react'
import { useEntityProps, type Geometry, type NodeHtmlProps } from './entity'

export interface EmphasisProps
  extends Geometry,
    NodeHtmlProps<HTMLDivElement> {
  id: string
}

/** Marker placed over an entity to flag it; the author styles how it reads. */
export function Emphasis({ id, x, y, w, h, style, children, ...rest }: EmphasisProps) {
  const entity = useEntityProps({
    id,
    kind: 'emphasis',
    x,
    y,
    w,
    h,
    emphasis: true,
    style: { pointerEvents: 'none', ...style },
  })
  return (
    <motion.div {...rest} {...entity}>
      {children}
    </motion.div>
  )
}
