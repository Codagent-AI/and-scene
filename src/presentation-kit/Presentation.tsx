import { DESIGN_H, DESIGN_W } from './constants'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { Footer } from './chrome/Footer'
import { Stage } from './Stage'
import { usePresentationNav } from './usePresentationNav'
import type { PresentationProps } from './types'
import './geometry.css'

export function Presentation<T>({ steps, title, initialMode = 'browse', canvas, brand }: PresentationProps<T>) {
  const { mode, index, go, previous, next, touch } = usePresentationNav(steps.length, initialMode)
  if (!steps[index]) return null

  return <main aria-label={title} data-presentation="" data-presentation-mode={mode}
    data-step-index={index} data-step-count={steps.length} {...touch}>
    <Header mode={mode} steps={steps} index={index} brand={brand} />
    {mode === 'browse' && <Toc steps={steps} index={index} go={go} />}
    <Stage steps={steps} index={index} width={canvas?.width ?? DESIGN_W}
      height={canvas?.height ?? DESIGN_H} mode={mode} />
    <Footer mode={mode} steps={steps} index={index} go={go} previous={previous} next={next} />
    <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene">made by and-scene</a>
  </main>
}
