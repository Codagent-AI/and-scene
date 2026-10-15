import type { Attribution, PresentationMode, Step } from '../types'
import { Toc } from './Toc'
export function Footer<T>({ steps, index, mode, goTo, next, prev, attribution }: { steps: readonly Step<T>[]; index: number; mode: PresentationMode; goTo: (index: number) => void; next: () => void; prev: () => void; attribution: Attribution | false }) {
  const step = steps[index]
  return <footer data-presentation-footer style={{ position: 'absolute', inset: 'auto 0 0' }}>
    {mode === 'browse' && <><div data-presentation-caption>{step?.caption}</div><Toc steps={steps} index={index} goTo={goTo} /><div data-presentation-progress aria-label="Presentation progress" style={{ display: 'flex', gap: 8 }}>{steps.map((item, itemIndex) => { const active = itemIndex === index; return <button key={item.id} type="button" data-presentation-progress-item={item.id} aria-label={`Go to step ${itemIndex + 1}: ${item.title}`} aria-current={active ? 'step' : undefined} data-presentation-active={active ? 'true' : undefined} onClick={() => goTo(itemIndex)} /> })}</div><button type="button" data-presentation-prev onClick={prev} disabled={index === 0}>Previous</button><button type="button" data-presentation-next onClick={next} disabled={index === steps.length - 1}>Next</button></>}
    {attribution && <a data-presentation-attribution href={attribution.href} target="_blank" rel="noreferrer" style={{ position: 'absolute', right: 24, bottom: 16 }}>{attribution.label}</a>}
  </footer>
}
