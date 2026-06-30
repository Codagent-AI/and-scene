import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE } from '../constants'

/**
 * Top chrome: a thin row carrying the home link (top-left) and the step marker
 * (top-right), with the step title centered just below it — in **both** modes.
 * The title is keyed so it remounts and fades in on each step change.
 *
 * The era label is no longer shown here — it drives the table of contents down
 * the left margin instead (see Toc).
 *
 * Branding is configurable so adopters can drop in their own logo and home link:
 * `brand` defaults to the text "and-scene", `homeHref`/`homeLabel` to the site
 * root. The host passes these via `<Presentation brand=… homeHref=… />`.
 */
export function Header({
  marker,
  title,
  brand = 'and-scene',
  homeHref = '/',
  homeLabel = 'And Scene home',
}: {
  marker: string
  title: string
  brand?: ReactNode
  homeHref?: string
  homeLabel?: string
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 px-6 pt-5 md:px-10 md:pt-6">
      <div className="flex items-center justify-between gap-4">
        <a href={homeHref} aria-label={homeLabel} className="shrink-0 text-sm uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-cyan">
          {brand}
        </a>
        <span className="text-sm text-amber">{marker}</span>
      </div>
      <motion.h1
        key={title}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="mt-3 text-center text-xl text-gray-100 md:text-3xl"
      >
        {title}
      </motion.h1>
    </header>
  )
}
