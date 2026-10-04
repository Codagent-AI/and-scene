import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Label({ id, children, className, style, ...props }: { id: string; children: ReactNode; className?: string; style?: CSSProperties } & Omit<React.ComponentProps<typeof motion.div>, 'children' | 'id' | 'className' | 'style'>) { return <motion.div layout layoutId={id} className={['presentation-node', 'presentation-label', className].filter(Boolean).join(' ')} data-presentation-node="" data-presentation-label="" data-presentation-entity={id} style={style} {...props}>{children}</motion.div> }
