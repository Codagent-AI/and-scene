import type { Step } from '../types'
export function Toc<T>({ steps, index, goTo }: { steps: readonly Step<T>[]; index: number; goTo: (index: number) => void }) {
  const sections = new Map<string, number>()
  steps.forEach((step, i) => { if (!sections.has(step.section)) sections.set(step.section, i) })
  return <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc="">{[...sections].map(([section, target]) => {
    const active = steps[index].section === section
    return <button type="button" key={section} className="presentation-toc-item" data-presentation-toc-item="" data-presentation-active={active ? 'true' : 'false'} aria-current={active ? 'location' : undefined} onClick={() => goTo(target)}>{section}</button>
  })}</nav>
}
