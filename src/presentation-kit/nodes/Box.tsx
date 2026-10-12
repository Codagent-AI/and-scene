import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { NodeProps } from '../types'
export function Box({ entityId, layoutId=entityId, children, Icon, ...props }: NodeProps & { children?: React.ReactNode; Icon?: LucideIcon }) { return <motion.div data-presentation-node="box" data-entity-id={entityId} layoutId={layoutId} {...props}>{Icon&&<Icon aria-hidden="true"/>}{children}</motion.div> }
