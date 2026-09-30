import { motion } from 'motion/react'
import type { SceneStyleProps } from '../types'
import { classNames } from '../utils'

interface EmphasisProps extends SceneStyleProps {
  id: string
}

export function Emphasis({ id, className, style, children }: EmphasisProps) {
  return (
    <motion.div
      className={classNames('presentation-emphasis', className)}
      data-presentation-node="emphasis"
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
