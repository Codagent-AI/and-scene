import { motion } from 'motion/react'
import type { SceneStyleProps } from '../types'
import { classNames } from '../utils'

interface ArrowProps extends SceneStyleProps {
  id: string
}

export function Arrow({ id, className, style, children }: ArrowProps) {
  return (
    <motion.div
      className={classNames('presentation-arrow', className)}
      data-presentation-node="arrow"
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
