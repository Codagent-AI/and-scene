import { motion, type HTMLMotionProps } from 'motion/react'
import type { ComponentType, ReactNode } from 'react'

type BoxProps = Omit<HTMLMotionProps<'div'>, 'children'> & { entityId: string; Icon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>; children?: ReactNode }
export function Box({ entityId, Icon, children, ...props }: BoxProps) { return <motion.div {...props} layoutId={entityId} data-presentation-node="box" data-entity-id={entityId}>{Icon && <Icon aria-hidden size={16} />}{children}</motion.div> }
