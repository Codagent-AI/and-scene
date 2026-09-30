import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { SceneStyleProps } from '../types'
import { classNames } from '../utils'

interface BoxProps extends SceneStyleProps {
  id: string
  glyph?: LucideIcon
}

export function Box({ id, glyph: Glyph, className, style, children }: BoxProps) {
  return (
    <motion.div
      className={classNames('presentation-box', className)}
      data-presentation-node="box"
      data-presentation-entity={id}
      exit={{ opacity: 0 }}
      layout
      layoutId={id}
      style={style}
    >
      {Glyph ? <Glyph aria-hidden="true" data-presentation-box-glyph="true" /> : null}
      {children}
    </motion.div>
  )
}
