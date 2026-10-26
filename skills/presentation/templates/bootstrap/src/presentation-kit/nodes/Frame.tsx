import { motion } from 'motion/react'
import type { SceneStyleProps } from '../types'
import { classNames } from '../utils'

interface FrameProps extends SceneStyleProps {
  id: string
}

export function Frame({ id, className, style, children }: FrameProps) {
  return (
    <motion.div
      className={classNames('presentation-frame', className)}
      data-presentation-node="frame"
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
