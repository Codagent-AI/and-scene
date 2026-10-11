import { motion, type HTMLMotionProps } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_DELAY } from '../constants'

type Base = { id: string; className?: string; style?: CSSProperties; children?: ReactNode; 'data-presentation-allow-overlap'?: string }
type BoxProps = Base & { Icon?: LucideIcon; layoutId?: string }
export function Box({ id, Icon, layoutId, ...props }: BoxProps) { return <motion.div data-presentation-box={id} layoutId={layoutId ?? id} {...props}>{Icon && <Icon aria-hidden="true" />}{props.children}</motion.div> }
export function Label({ id, ...props }: Base) { return <span data-presentation-label={id} {...props}>{props.children}</span> }
type MotionNodeProps = Base & HTMLMotionProps<'div'>
export function Arrow({ id, ...props }: MotionNodeProps) { return <motion.div data-presentation-arrow={id} {...props} /> }
export function Frame({ id, ...props }: MotionNodeProps) { return <motion.div data-presentation-frame={id} layoutId={id} {...props} /> }
export function Emphasis({ id, ...props }: MotionNodeProps) { return <motion.div data-presentation-emphasis={id} {...props} /> }
export function SymbolChip({ id, ...props }: Base) { return <span data-presentation-symbol-chip={id} {...props}>{props.children}</span> }

export function Appear({ id, delay = ENTER_DELAY, ...props }: MotionNodeProps & { delay?: number }) {
  return <motion.div data-presentation-appear={id} {...props} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay } }} exit={{ opacity: 0 }} />
}

export function SceneLayer({ id, children, className, style }: Base) {
  return <div data-presentation-layer={id} className={className} style={{ position: 'absolute', inset: 0, ...style }}>{children}</div>
}
