import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_DELAY, LAYOUT_T } from '../constants'
export function Box({ id, children, icon: Icon, className, style, entering = false, ...props }: { id: string; children: ReactNode; icon?: LucideIcon; className?: string; style?: CSSProperties; entering?: boolean } & Omit<React.ComponentProps<typeof motion.div>, 'children' | 'id' | 'className' | 'style'>) {
  return <motion.div layout layoutId={id} className={['presentation-node', 'presentation-box', className].filter(Boolean).join(' ')} data-presentation-node="" data-presentation-box="" data-presentation-entity={id} style={style} initial={entering ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: { duration: LAYOUT_T }, opacity: { duration: 0.25, delay: entering ? ENTER_DELAY : 0 } }} {...props}>{Icon && <Icon aria-hidden="true" data-presentation-glyph=""/>}{children}</motion.div>
}
