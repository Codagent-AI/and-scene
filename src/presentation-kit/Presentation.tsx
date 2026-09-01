import { useEffect, useState } from 'react'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { PresentationProps } from './types'
import { usePresentationNav } from './usePresentationNav'

function useWideViewport() {
  const [wide, setWide] = useState(() => window.matchMedia?.('(min-width: 900px)').matches ?? false)

  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 900px)')
    if (!media) return undefined
    const update = () => setWide(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return wide
}

export function Presentation<TPayload>({
  steps,
  title,
  initialMode = 'browse',
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const wide = useWideViewport()
  if (steps.length === 0) throw new Error('A presentation needs at least one step.')
  const step = steps[nav.index]!

  return (
    <main
      data-testid="presentation-root"
      data-presentation-root="true"
      data-presentation-mode={nav.mode}
      onTouchStart={nav.onTouchStart}
      onTouchEnd={nav.onTouchEnd}
      style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', minHeight: '100svh', position: 'relative' }}
    >
      <Header mode={nav.mode} presentationTitle={title} step={step} />
      <div
        data-presentation-content="true"
        style={{ display: 'grid', gridTemplateColumns: nav.mode === 'browse' && wide ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)', minHeight: 0 }}
      >
        {nav.mode === 'browse' && wide ? <Toc steps={steps} activeIndex={nav.index} goTo={nav.goTo} /> : null}
        <Stage step={step} stepIndex={nav.index} />
      </div>
      <div
        data-testid="presentation-chrome"
        data-presentation-chrome="true"
        data-step-count={steps.length}
        data-step-index={nav.index}
      >
        <Footer
          mode={nav.mode}
          step={step}
          stepIndex={nav.index}
          steps={steps}
          next={nav.next}
          previous={nav.previous}
          goTo={nav.goTo}
        />
      </div>
      <a
        data-presentation-attribution="true"
        href="https://github.com/Codagent-AI/and-scene"
        style={{ bottom: 0, position: 'absolute', right: 0 }}
      >
        made by and-scene
      </a>
    </main>
  )
}
