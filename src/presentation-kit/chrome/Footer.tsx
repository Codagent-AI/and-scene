import { AnimatePresence, motion } from 'motion/react'
import { EASE } from '../constants'
import type { Mode, StepMeta } from '../types'

interface FooterProps {
  steps: StepMeta[]
  step: number
  last: number
  mode: Mode
  homeHref?: string
  onPrev: () => void
  onNext: () => void
  onSelect: (i: number) => void
}

/**
 * Bottom chrome: the per-step caption (browse mode only — the title now lives
 * at the top in both modes), a row of progress dots, and prev/next.
 */
export function Footer({
  steps,
  step,
  last,
  mode,
  homeHref = '/',
  onPrev,
  onNext,
  onSelect,
}: FooterProps) {
  const current = steps[step]
  const browsing = mode === 'browse'

  return (
    <footer className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6 md:px-10">
      <div className="mx-auto max-w-3xl">
        {/* Browse: the caption sits here, above the dots. Presenter: nothing —
            the title is at the top now, so the band collapses away. */}
        {browsing && (
          <div className="flex min-h-[4.5rem] items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={`caption-${step}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="text-center font-sans text-base leading-relaxed text-gray-300 md:text-lg"
              >
                {current.caption}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        <div
          className={`flex items-center ${browsing ? 'mt-5 justify-between gap-3' : 'justify-center'}`}
        >
          {/* progress dots — centered on their own in presenter mode. In browse
              mode they share the row with the nav, so they take the leftover
              space and wrap rather than shoving prev/next off a narrow screen. */}
          <div
            data-testid="step-progress"
            data-step-count={steps.length}
            data-step-index={step}
            className={`flex items-center gap-2 ${browsing ? 'min-w-0 flex-1 flex-wrap' : ''}`}
          >
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => onSelect(i)}
                // Consecutive steps in an era share that label, so era alone gives
                // many dots the same name. The position + title make each dot
                // distinct for screen readers; blank-title chrome cards fall back
                // to era.
                aria-label={`Go to step ${i + 1}: ${s.title || s.era}`}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === step ? 'bg-cyan' : 'bg-gray-400/40 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* nav — hidden in presenter mode */}
          {browsing && (
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={onPrev}
                disabled={step === 0}
                className="btn-neutral px-4 py-1.5 disabled:opacity-30"
              >
                &#x2190; prev
              </button>
              {/* On the last step there's nowhere further to advance, so the
                  next button becomes an exit back to the home route. */}
              {step === last ? (
                <a href={homeHref} className="btn-secondary px-4 py-1.5">
                  home
                </a>
              ) : (
                <button onClick={onNext} className="btn-secondary px-4 py-1.5">
                  next &#x2192;
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
