import { useEffect, useState } from 'react'
import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL, TOC_MIN_WIDTH } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import type { PresentationProps } from './types'
import { usePresentationNav } from './usePresentationNav'

function useWideViewport() {
  const query = `(min-width: ${TOC_MIN_WIDTH}px)`
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return wide
}

export function Presentation<T = undefined>({
  steps,
  title,
  initialMode = 'present',
  brand,
  attribution,
  className,
}: PresentationProps<T>) {
  const { index, mode, go, next, prev, touchHandlers } = usePresentationNav(steps.length, initialMode)
  const wide = useWideViewport()
  const step = steps[index]
  if (!step) return null

  return (
    <div
      className={className}
      data-presentation-root=""
      data-presentation-title-text={title}
      data-presentation-mode={mode}
      data-step-count={steps.length}
      data-step-index={index}
      data-step-id={step.id}
      {...touchHandlers}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%' }}
    >
      <Header mode={mode} marker={`${index + 1} / ${steps.length}`} era={step.era} title={step.title} brand={brand} />
      <div style={{ display: 'flex', flex: '1 1 0', minHeight: 0 }}>
        {mode === 'browse' && wide && <Toc steps={steps} index={index} go={go} />}
        <Stage steps={steps} index={index} mode={mode} />
      </div>
      <Footer mode={mode} steps={steps} index={index} go={go} next={next} prev={prev} />
      {attribution !== null &&
        (attribution ?? (
          <a
            data-presentation-attribution=""
            href={ATTRIBUTION_HREF}
            target="_blank"
            rel="noreferrer"
            style={{ position: 'absolute', right: 0, bottom: 0 }}
          >
            {ATTRIBUTION_LABEL}
          </a>
        ))}
    </div>
  )
}
