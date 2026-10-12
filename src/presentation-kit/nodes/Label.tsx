import { motion } from 'motion/react'
import type { NodeProps } from '../types'
export function Label({entityId,layoutId=entityId,children,...props}:NodeProps & {children?:React.ReactNode}) { return <motion.div data-presentation-node="label" data-entity-id={entityId} layoutId={layoutId} {...props}>{children}</motion.div> }
