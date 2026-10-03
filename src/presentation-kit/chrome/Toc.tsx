import type { Step } from '../types.ts'
export function Toc<T>({ steps, index, goTo }: { steps: readonly Step<T>[]; index: number; goTo: (index: number) => void }) {
  const sections = new Map<string, number>()
  steps.forEach((step, position) => { if (!sections.has(step.era)) sections.set(step.era, position) })
  const activeEra = steps[index]?.era
  return <>
    <style>{'@media (max-width: 820px) { .presentation-toc { display: none; } }'}</style>
    <nav className="presentation-toc" aria-label="Presentation sections" data-presentation-toc="" style={{ position: 'absolute', zIndex: 1, top: '50%', right: 0, transform: 'translateY(-50%)' }}>
      {[...sections].map(([era, position]) => <button key={era} type="button" className="presentation-toc-item" data-presentation-toc-item="" data-presentation-active={era === activeEra ? 'true' : 'false'} aria-current={era === activeEra ? 'location' : undefined} onClick={() => goTo(position)}>{era}</button>)}
    </nav>
  </>
}
