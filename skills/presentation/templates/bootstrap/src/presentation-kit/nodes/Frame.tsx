import { motion, type HTMLMotionProps } from 'motion/react'
export function Frame({ entityId, ...props }: HTMLMotionProps<'div'> & { entityId: string }) { return <motion.div {...props} layoutId={entityId} data-presentation-node="frame" data-entity-id={entityId} /> }
