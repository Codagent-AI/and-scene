import { motion, type HTMLMotionProps } from 'motion/react'
export function Emphasis({ entityId, ...props }: HTMLMotionProps<'div'> & { entityId: string }) { return <motion.div {...props} layoutId={entityId} data-presentation-node="emphasis" data-entity-id={entityId} /> }
