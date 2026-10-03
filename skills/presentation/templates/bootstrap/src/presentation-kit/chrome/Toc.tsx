import type { Step } from '../types'

export function Toc<TPayload>({ steps, index, onJump }: { steps: readonly Step<TPayload>[]; index: number; onJump: (index: number) => void }) {
  const sections = steps.reduce<{ section: string; index: number }[]>((result, step, stepIndex) => result.some((item) => item.section === step.section) ? result : [...result, { section: step.section, index: stepIndex }], [])
  return <nav data-presentation-toc aria-label="Table of contents">{sections.map((item) => <button key={item.section} type="button" aria-current={steps[index]?.section === item.section ? 'true' : undefined} data-presentation-toc-item={steps[index]?.section === item.section ? 'active' : undefined} onClick={() => onJump(item.index)}>{item.section}</button>)}</nav>
}
