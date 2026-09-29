import type { Step } from '../types'
export function Toc<T>({ steps, index, onJump }: { steps: readonly Step<T>[]; index: number; onJump: (index: number) => void }) {
  const eras = [...new Map(steps.map(step => [step.era, {
    era: step.era,
    index: steps.findIndex(item => item.era === step.era),
  }])).values()]
  const activeEra = steps[index]?.era
  return <nav className="presentation-toc" aria-label="Presentation sections" data-presentation-toc="">
    {eras.map(item => <button type="button" key={item.era} onClick={() => onJump(item.index)} aria-current={item.era === activeEra ? 'location' : undefined} data-presentation-toc-item="" data-presentation-active={item.era === activeEra ? 'true' : 'false'}>{item.era}</button>)}
  </nav>
}
