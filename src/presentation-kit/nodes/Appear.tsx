import { motion, type HTMLMotionProps } from 'motion/react'
import { useEntrance } from '../entrance'

export interface AppearProps
  extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'id'> {
  id: string
}

/**
 * Sequences a newcomer in after persisting entities settle. Ids that are
 * already on stage get no fade, and the entrance never replays on updates.
 */
export function Appear({ id, children, ...rest }: AppearProps) {
  const entrance = useEntrance(id)
  return (
    <motion.div data-presentation-appear={id} {...rest} {...entrance}>
      {children}
    </motion.div>
  )
}
