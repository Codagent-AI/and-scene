import { useEffect } from 'react'
import { usePresentationNav } from './usePresentationNav'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { Attribution } from './chrome/Attribution'
import type { PresentationProps } from './types'

/**
 * Composes the scene kit's stage and chrome from an ordered step array. Owns
 * no visual styling — only behavior, layout plumbing, and stable DOM hooks.
 */
export function Presentation<TPayload>({ steps, title, initialMode = 'present' }: PresentationProps<TPayload>) {
  const nav = usePresentationNav({ stepCount: steps.length, initialMode })
  const step = steps[nav.index]
  const marker = String(nav.index + 1).padStart(2, '0')

  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <div
      className="sk-presentation"
      data-scene-kit="presentation"
      data-step-count={steps.length}
      data-step-index={nav.index}
      onTouchStart={nav.touchHandlers.onTouchStart}
      onTouchEnd={nav.touchHandlers.onTouchEnd}
    >
      <Header marker={marker} title={step.title} />
      <div className="sk-presentation__body" data-scene-kit="body">
        <Stage steps={steps} index={nav.index} mode={nav.mode} />
        {nav.mode === 'browse' ? (
          <Toc steps={steps} activeIndex={nav.index} onSelectSection={nav.goTo} />
        ) : null}
      </div>
      <Footer
        mode={nav.mode}
        caption={step.caption}
        stepIndex={nav.index}
        stepCount={steps.length}
        onSelectStep={nav.goTo}
        onPrev={nav.prev}
        onNext={nav.next}
        canPrev={!nav.isFirst}
        canNext={!nav.isLast}
      />
      <button
        type="button"
        className="sk-mode-toggle"
        data-scene-kit="mode-toggle"
        aria-label={`Switch to ${nav.mode === 'present' ? 'browse' : 'present'} mode`}
        onClick={nav.toggleMode}
      >
        {nav.mode === 'present' ? 'Browse' : 'Present'}
      </button>
      <Attribution />
    </div>
  )
}
