import { motion } from 'motion/react'
import { useEntityProps, type Geometry, type NodeHtmlProps } from './entity'

export interface LabelProps
  extends Geometry,
    NodeHtmlProps<HTMLSpanElement> {
  id: string
  emphasis?: boolean
}

export function Label({ id, x, y, w, h, emphasis, style, children, ...rest }: LabelProps) {
  const entity = useEntityProps({ id, kind: 'label', x, y, w, h, emphasis, style })
  return (
    <motion.span {...rest} {...entity}>
      {children}
    </motion.span>
  )
}
