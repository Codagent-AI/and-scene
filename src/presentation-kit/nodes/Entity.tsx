import { AnimatePresence, motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants'

export type EntityProps = Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> & {
  id: string
  label?: string
  children?: ReactNode
}

export function Entity({
  id, kind, label, children, transition, ...props
}: EntityProps & { kind: string }) {
  return (
    <motion.div layout layoutId={id} exit={{ opacity: 0 }} {...props}
      data-presentation-entity={id} data-presentation-node={kind}
      transition={{ opacity: { duration: EXIT_T }, layout: { duration: LAYOUT_T, ease: EASE }, ...transition }}>
      {children}
      {label !== undefined && (
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: LAYOUT_T, ease: EASE }}>{label}</motion.span>
        </AnimatePresence>
      )}
    </motion.div>
  )
}
