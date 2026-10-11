import type { Step } from '../types'
import { Toc } from './Toc'

export function Footer<T>({ steps, index, jumpTo, next, prev, mode }: { steps: readonly Step<T>[]; index: number; jumpTo: (index: number) => void; next: () => void; prev: () => void; mode: 'browse' | 'present' }) {
  const step = steps[index]
  return <footer data-presentation-footer="">
    {mode === 'browse' && <>
      <p data-presentation-caption="">{step?.caption}</p>
      <Toc steps={steps} index={index} jumpTo={jumpTo} />
      <nav aria-label="Step navigation" data-presentation-progress="">
        {steps.map((item, position) => <button key={item.id} type="button" aria-label={`Go to step ${position + 1}`} aria-current={position === index ? 'step' : undefined} data-presentation-active={position === index ? '' : undefined} onClick={() => jumpTo(position)}>{position + 1}</button>)}
      </nav>
      <button type="button" onClick={prev} disabled={index === 0}>Previous</button>
      <button type="button" onClick={next} disabled={index === steps.length - 1}>Next</button>
    </>}
    <a data-presentation-attribution="" href="https://github.com/Codagent-AI/and-scene" target="_blank" rel="noreferrer" style={{ position: 'fixed', right: 12, bottom: 12 }}>made by and-scene</a>
  </footer>
}
