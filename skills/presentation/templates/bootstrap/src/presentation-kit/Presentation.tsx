import { useEffect, useState, type ReactNode } from 'react'
import { WIDE_BREAKPOINT } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { erasOf } from './chrome/eras'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { Mode, Step } from './types'

export interface PresentationProps<TPayload> {
  title: string
  steps: Step<TPayload>[]
  initialMode?: Mode
  brand?: ReactNode
}

const WIDE_QUERY = `(min-width: ${WIDE_BREAKPOINT}px)`

function canMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

/** Tracks whether the viewport is at or above the wide breakpoint. */
function useIsWide(): boolean {
  const [wide, setWide] = useState(() => canMatchMedia() && window.matchMedia(WIDE_QUERY).matches)

  useEffect(() => {
    if (!canMatchMedia()) return
    const query = window.matchMedia(WIDE_QUERY)
    const update = () => setWide(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return wide
}

/** A complete presentation: the active step on the scene stage with present/browse chrome. */
export function Presentation<TPayload>({ title, steps, initialMode, brand }: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useIsWide()
  const step = steps[nav.index]
  const eras = erasOf(steps)
  const marker = `${String(nav.index + 1).padStart(2, '0')} · ${step.era}`

  return (
    <div
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}
    >
      <Header mode={nav.mode} deckTitle={title} marker={marker} brand={brand} />
      <Stage step={step} mode={nav.mode} />
      <Footer
        mode={nav.mode}
        steps={steps}
        index={nav.index}
        eras={eras}
        wide={wide}
        onGoTo={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
      />
    </div>
  )
}
