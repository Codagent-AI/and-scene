import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT } from '../constants'
import type { ReactNode } from 'react'

type Props = Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode; id: string; icon?: ReactNode }
export function Box({ id, children, icon, ...props }: Props) {
  return <motion.div layout layoutId={id} exit={EXIT} data-presentation-node="box" data-entity-id={id} {...props}>{icon}{children}</motion.div>
}
