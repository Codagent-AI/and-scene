import type { Step } from '../types'

export function Toc<TPayload>({ steps, index, goTo }: { steps: readonly Step<TPayload>[]; index: number; goTo: (index: number) => void }) {
  const eras = steps.reduce<{ era: string; target: number; end: number }[]>((groups, step, stepIndex) => {
    const current = groups.at(-1)
    if (current?.era === step.era) current.end = stepIndex
    else groups.push({ era: step.era, target: stepIndex, end: stepIndex })
    return groups
  }, [])
  return <nav className="presentation-toc" aria-label="Table of contents" data-presentation-toc="">
    {eras.map(({ era, target, end }, eraIndex) => { const active = index >= target && index <= end
      return <button type="button" key={`${era}-${target}`} className="presentation-toc-item" data-presentation-toc-item="" data-active={active ? 'true' : 'false'} aria-current={active ? 'step' : undefined} onClick={() => goTo(target)} aria-label={`Go to ${eraIndex + 1}: ${era}`}>{era}</button> })}
  </nav>
}
