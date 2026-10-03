import type { Step } from '../types'
export function Toc<T>({ steps, index, onJump }: { steps: readonly Step<T>[]; index: number; onJump: (index: number) => void }) {
  const firstIndexByEra = new Map<string, number>()
  steps.forEach((step, stepIndex) => { if (!firstIndexByEra.has(step.era)) firstIndexByEra.set(step.era, stepIndex) })
  const eras = [...firstIndexByEra].map(([era, index]) => ({ era, index }))
  const activeEra = steps[index]?.era
  return <nav className="presentation-toc" aria-label="Presentation sections" data-presentation-toc="">
    {eras.map(item => <button type="button" key={item.era} onClick={() => onJump(item.index)} aria-current={item.era === activeEra ? 'location' : undefined} data-presentation-toc-item="" data-presentation-active={item.era === activeEra ? 'true' : 'false'}>{item.era}</button>)}
  </nav>
}
