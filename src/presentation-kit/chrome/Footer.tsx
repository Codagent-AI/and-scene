import { AnimatePresence, motion } from 'motion/react'
import { EASE } from '../constants'
import type { Mode, StepMeta } from '../types'

interface FooterProps {
  steps: StepMeta[]
  step: number
  last: number
  mode: Mode
  onPrev: () => void
  onNext: () => void
  onSelect: (i: number) => void
}

export function Footer({ steps, step, last, mode, onPrev, onNext, onSelect }: FooterProps) {
  const current = steps[step]
  const browsing = mode === 'browse'

  return (
    <footer className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex min-h-[4.5rem] items-center justify-center">
          <AnimatePresence mode="wait">
            {browsing ? (
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
            ) : (
              <motion.h1
                key={`title-${step}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="text-center text-2xl text-gray-100 md:text-3xl"
              >
                {current.title}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        <div
          className={`mt-5 flex items-center ${browsing ? 'justify-between gap-3' : 'justify-center'}`}
        >
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
                aria-label={`Go to step ${i + 1}: ${s.title || s.era}`}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === step ? 'bg-cyan' : 'bg-gray-400/40 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {browsing && (
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={onPrev}
                disabled={step === 0}
                className="btn-neutral px-4 py-1.5 disabled:opacity-30"
              >
                &#x2190; prev
              </button>
              {step === last ? (
                <a href="/" className="btn-secondary px-4 py-1.5">
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
