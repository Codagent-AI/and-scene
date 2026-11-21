import { Footer } from './chrome/Footer'
import { Header } from './chrome/Header'
import { Toc } from './chrome/Toc'
import { DESIGN_H, DESIGN_W } from './constants'
import { Stage } from './Stage'
import type { PresentationProps, Step } from './types'
import { usePresentationNav } from './usePresentationNav'

function getSceneKey<TPayload>(steps: readonly Step<TPayload>[], index: number) {
  const { groupKey, Scene } = steps[index]
  while (index > 0 && groupKey !== undefined
    && steps[index - 1].groupKey === groupKey && steps[index - 1].Scene === Scene) {
    index--
  }
  return steps[index].id
}

export function Presentation<TPayload = undefined>({
  title, steps, initialMode = 'browse', width = DESIGN_W, height = DESIGN_H, brand, attribution,
}: PresentationProps<TPayload>) {
  const nav = usePresentationNav(steps.length, initialMode)
  const step = steps[nav.index]
  if (!step) return null

  return (
    <main data-presentation="" data-presentation-mode={nav.mode} data-presentation-name={title}
      data-step-count={steps.length} data-step-index={nav.index} data-presentation-step-id={step.id}
      data-presentation-era-name={step.era} aria-label={title} {...nav.touch}
      style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', height: '100dvh' }}>
      <Header brand={brand} index={nav.index} count={steps.length} title={step.title} />
      <div data-presentation-body="" style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', minHeight: 0 }}>
        <div>{nav.mode === 'browse' && <Toc steps={steps} index={nav.index} jump={nav.jump} />}</div>
        <Stage step={step} sceneKey={getSceneKey(steps, nav.index)} mode={nav.mode} width={width} height={height} />
      </div>
      <Footer steps={steps} {...nav} attribution={attribution} />
    </main>
  )
}
