import type { Step } from '../types'
export function Toc<T>({ steps, index, goTo }: { steps: readonly Step<T>[]; index: number; goTo: (index: number) => void }) {
  const eras = [...new Set(steps.map(step => step.era))]
  return <nav aria-label="Presentation sections" className="presentation-toc" data-presentation-toc="">
    {eras.map(era => { const eraIndex = steps.findIndex(step => step.era === era); return <button type="button" key={era} aria-current={steps[index].era === era ? 'location' : undefined} data-presentation-toc-item="" data-presentation-active={steps[index].era === era ? 'true' : 'false'} onClick={() => goTo(eraIndex)}>{era}</button> })}
  </nav>
}
