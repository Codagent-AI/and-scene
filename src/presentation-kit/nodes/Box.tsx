import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEntityProps, type Geometry, type NodeHtmlProps } from './entity'

export interface BoxProps
  extends Geometry,
    NodeHtmlProps<HTMLDivElement> {
  id: string
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
  emphasis?: boolean
}

export function Box({ id, x, y, w, h, Icon, emphasis, style, children, ...rest }: BoxProps) {
  const entity = useEntityProps({ id, kind: 'box', x, y, w, h, emphasis, style })
  return (
    <motion.div {...rest} {...entity}>
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
