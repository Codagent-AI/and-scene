import { AnimatePresence, type AnimatePresenceProps } from 'motion/react'
import type { PropsWithChildren } from 'react'

/** Hosts exit animations for conditionally rendered entities; give each direct child a stable `key`. */
export function Presence({ initial = false, ...props }: PropsWithChildren<AnimatePresenceProps>) { return <AnimatePresence initial={initial} {...props} /> }
