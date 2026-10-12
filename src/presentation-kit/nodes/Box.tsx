import type React from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
type Props = Omit<HTMLMotionProps<'div'>, 'children'> & { layoutId: string; Icon?: LucideIcon; children?: React.ReactNode }
export function Box({ layoutId, Icon, children, ...props }: Props) { return <motion.div layout layoutId={layoutId} data-presentation-box {...props}>{Icon && <Icon aria-hidden="true" />}{children}</motion.div> }
