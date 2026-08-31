import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { PresentationProps } from './types'
import { usePresentationNav } from './usePresentationNav'

function useWideViewport() {
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 900)

  useEffect(() => {
    const update = () => setIsWide(window.innerWidth >= 900)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return isWide
}

export function Presentation<TPayload>({ steps, title, initialMode = 'browse' }: PresentationProps<TPayload>) {
  if (steps.length === 0) throw new Error('A presentation requires at least one step.')
  const navigation = usePresentationNav(steps.length, initialMode)
  const step = steps[navigation.stepIndex]!
  const isBrowse = navigation.mode === 'browse'
  const isWide = useWideViewport()

  return (
    <main
      data-presentation-root
      data-testid="presentation-root"
      data-presentation-mode={navigation.mode}
      onTouchStart={navigation.onTouchStart}
      onTouchEnd={navigation.onTouchEnd}
    >
      <div data-presentation-chrome data-testid="presentation-chrome" data-step-count={steps.length} data-step-index={navigation.stepIndex}>
        <Header step={step} stepIndex={navigation.stepIndex} mode={navigation.mode} title={title} />
        <button
          type="button"
          data-presentation-mode-toggle
          aria-label={isBrowse ? 'Switch to present mode' : 'Switch to browse mode'}
          onClick={navigation.toggleMode}
        >
          {isBrowse ? 'Present' : 'Browse'}
        </button>
        {isBrowse && isWide && <Toc steps={steps} stepIndex={navigation.stepIndex} goTo={navigation.goTo} />}
      </div>
      <Stage step={step} stepIndex={navigation.stepIndex} mode={navigation.mode} />
      {isBrowse && <Footer step={step} stepIndex={navigation.stepIndex} steps={steps} goTo={navigation.goTo} next={navigation.next} previous={navigation.previous} />}
      <a
        href="https://github.com/Codagent-AI/and-scene"
        data-presentation-attribution
        data-testid="presentation-attribution"
        style={{ bottom: 0, position: 'absolute', right: 0 }}
      >
        made by and-scene
      </a>
    </main>
  )
}
import { useEffect, useState } from 'react'
