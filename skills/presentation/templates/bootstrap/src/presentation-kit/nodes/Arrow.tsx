import { motion, type HTMLMotionProps } from 'motion/react'
export function Arrow({ entityId, ...props }: HTMLMotionProps<'div'> & { entityId: string }) { return <motion.div {...props} layoutId={entityId} data-presentation-node="arrow" data-entity-id={entityId} aria-hidden="true" /> }
