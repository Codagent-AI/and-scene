import { motion, type HTMLMotionProps } from 'motion/react'
export type LabelProps = HTMLMotionProps<'span'> & { entityId: string }
export function Label({ entityId, ...props }: LabelProps) { return <motion.span {...props} layoutId={entityId} data-presentation-node="label" data-entity-id={entityId} /> }
