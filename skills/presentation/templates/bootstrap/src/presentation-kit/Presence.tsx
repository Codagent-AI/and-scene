import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

// Wrap conditionally rendered entities so departing ones can animate out. Give each direct child a stable `key`
// (for several entities that leave together, a keyed Fragment).
export function Presence({ children }: { children: ReactNode }) { return <AnimatePresence>{children}</AnimatePresence> }
