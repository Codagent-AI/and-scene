import { motion } from 'motion/react'
import { EASE } from '../constants'
import type { Mode } from '../types'

export function Header({ marker, title, mode }: { marker: string; title: string; mode: Mode }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 px-6 pt-6 md:px-10">
      <div className="flex items-center justify-between gap-4">
        <a href="/" aria-label="And Scene home" className="shrink-0 text-sm uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-cyan">
          and-scene
        </a>
        <span className="text-sm text-amber">{marker}</span>
      </div>
      {mode === 'browse' && (
        <motion.h1
          key={title}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-4 text-center text-lg text-gray-100 md:text-2xl"
        >
          {title}
        </motion.h1>
      )}
    </header>
  )
}
