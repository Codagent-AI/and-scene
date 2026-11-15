import type { ReactNode } from 'react'
import type { Mode, Step } from './types'
import { Stage } from './Stage'
import { Header } from './chrome/Header'
import { Footer } from './chrome/Footer'
import { Toc } from './chrome/Toc'
import { usePresentationNav } from './usePresentationNav'
import { useFitScale } from './useFitScale'
export interface PresentationProps<T> { steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode; width?: number; height?: number }
export function Presentation<T>({ steps, title, initialMode = 'browse', brand, attribution, width, height }: PresentationProps<T>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const { wide, compact } = useFitScale(nav.mode)
  if (!steps.length) throw new Error('Presentation requires at least one step')
  return <main data-presentation-root="" data-step-count={steps.length} data-step-index={nav.index} data-presentation-mode={nav.mode} data-presentation-layout={compact ? 'flow' : 'viewport'} aria-label={title} style={{ position: 'relative', minHeight: '100dvh', display: compact ? 'flow-root' : undefined }}>
    <Header step={steps[nav.index]} index={nav.index} mode={nav.mode} brand={brand} />
    <button data-presentation-mode-toggle="" onClick={nav.toggle} aria-label="Toggle presentation mode">{nav.mode === 'browse' ? 'Present' : 'Browse'}</button>
    {nav.mode === 'browse' && wide && <Toc compact={compact} steps={steps} index={nav.index} go={nav.go} />}
    <Stage step={steps[nav.index]} mode={nav.mode} width={width} height={height} />
    <Footer compact={compact} steps={steps} index={nav.index} mode={nav.mode} go={nav.go} next={nav.next} prev={nav.prev} />
    <div data-presentation-attribution="" style={{ position: 'absolute', bottom: 16, right: 24 }}>{attribution === undefined ? <a href="https://github.com/Codagent-AI/and-scene">made by and-scene</a> : attribution}</div>
  </main>
}
