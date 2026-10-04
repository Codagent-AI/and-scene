import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
export function Frame({ id, children, className, style, ...props }: { id: string; children: ReactNode; className?: string; style?: CSSProperties } & Omit<React.ComponentProps<typeof motion.div>, 'children' | 'id' | 'className' | 'style'>) { return <motion.div layout layoutId={id} className={['presentation-node', 'presentation-frame', className].filter(Boolean).join(' ')} data-presentation-node="" data-presentation-frame="" data-presentation-entity={id} style={style} {...props}>{children}</motion.div> }
