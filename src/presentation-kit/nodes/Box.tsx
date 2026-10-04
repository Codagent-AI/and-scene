import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { NodeProps } from './shared'
import { nodeAttributes } from './shared'
export function Box({ icon: Icon, children, ...props }: NodeProps & { icon?: LucideIcon }) { return <motion.div {...nodeAttributes(props)} data-presentation-box="">{Icon && <Icon aria-hidden="true" data-presentation-glyph="" />}{children}</motion.div> }
