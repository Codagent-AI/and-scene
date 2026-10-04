import { useMemo } from 'react'
import { DESIGN_H, DESIGN_W } from './constants'
import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'

export function Presentation<TPayload>({ steps, title, initialMode = 'browse', design, attribution, brand, className, style }: PresentationProps<TPayload>) {
  const dimensions = useMemo(() => ({ width: design?.width ?? DESIGN_W, height: design?.height ?? DESIGN_H }), [design?.width, design?.height])
  const nav = usePresentationNav(steps.length, initialMode)
  if (steps.length === 0) return <main className={['presentation', className].filter(Boolean).join(' ')} style={style} data-presentation="" data-mode={nav.mode} data-step-count="0" data-step-index="0" />
  const active = steps[nav.index]
  return <main className={['presentation', className].filter(Boolean).join(' ')} style={style} data-presentation="" data-mode={nav.mode} data-step-count={steps.length} data-step-index={nav.index}>
    <Header mode={nav.mode} title={title} step={active} index={nav.index} brand={brand} />
    {nav.mode === 'browse' && <Toc steps={steps} index={nav.index} goTo={nav.goTo} />}
    <Stage steps={steps} index={nav.index} mode={nav.mode} width={dimensions.width} height={dimensions.height} />
    <Footer mode={nav.mode} step={active} index={nav.index} count={steps.length} title={title} previous={nav.prev} next={nav.next} goTo={nav.goTo} attribution={attribution} />
    <button type="button" className="presentation-mode-toggle" data-presentation-mode-toggle="" onClick={nav.toggleMode} aria-label={`Switch to ${nav.mode === 'browse' ? 'present' : 'browse'} mode`}>{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
  </main>
}
