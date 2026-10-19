import { motion } from 'motion/react'
import { useEntityProps, type Geometry, type NodeHtmlProps } from './entity'

export interface FrameProps
  extends Geometry,
    NodeHtmlProps<HTMLDivElement> {
  id: string
  emphasis?: boolean
}

/** A region drawn around other entities; takes no part in their layout. */
export function Frame({ id, x, y, w, h, emphasis, style, children, ...rest }: FrameProps) {
  const entity = useEntityProps({
    id,
    kind: 'frame',
    x,
    y,
    w,
    h,
    emphasis,
    style: { pointerEvents: 'none', ...style },
  })
  return (
    <motion.div {...rest} {...entity}>
      {children}
    </motion.div>
  )
}
