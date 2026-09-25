import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'
export function Presence({ children }: { children?: ReactNode }) {
  return <AnimatePresence>{children}</AnimatePresence>
}
