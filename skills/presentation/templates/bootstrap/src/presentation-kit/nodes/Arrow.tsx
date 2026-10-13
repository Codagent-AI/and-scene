import { motion } from 'motion/react'
export function Arrow({ id, className = '', children = '→' }: { id: string; className?: string; children?: string }) { return <motion.span layout layoutId={id} data-presentation-entity={id} className={className} aria-hidden="true">{children}</motion.span> }
