import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

export type NodeProps = { id: string; children: ReactNode; className?: string; style?: CSSProperties; [key: `data-${string}`]: string | undefined }

// Shared body of the layout primitives: stable identity for layout projection, a fade-out exit,
// and the primitive's data-presentation-* hook. Extra data-* props pass through for authors.
export function LayoutNode({ hook, id, children, className, style, ...rest }: NodeProps & { hook: string; 'aria-hidden'?: 'true' }) {
  return <motion.div layout layoutId={id} exit={{ opacity: 0 }} className={className} style={style} {...{ [`data-presentation-${hook}`]: '' }} {...rest}>{children}</motion.div>
}
