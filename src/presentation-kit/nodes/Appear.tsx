import { motion } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
import type { SceneStyleProps } from '../types'
import { classNames } from '../utils'

interface AppearProps extends SceneStyleProps {
  id?: string
}

export function Appear({ id, className, style, children }: AppearProps) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={classNames('presentation-appear', className)}
      data-presentation-node="appear"
      data-presentation-entity={id}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      style={style}
      transition={{ delay: LAYOUT_T + ENTER_DELAY, duration: ENTER_T, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
