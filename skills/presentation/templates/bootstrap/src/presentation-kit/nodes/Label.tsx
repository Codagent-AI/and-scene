import { motion } from 'motion/react'
import type { SceneStyleProps } from '../types'
import { classNames } from '../utils'

interface LabelProps extends SceneStyleProps {
  id: string
}

export function Label({ id, className, style, children }: LabelProps) {
  return (
    <motion.div
      className={classNames('presentation-label', className)}
      data-presentation-node="label"
      data-presentation-entity={id}
      exit={{ opacity: 0 }}
      layout
      layoutId={id}
      style={style}
    >
      {children}
    </motion.div>
  )
}
