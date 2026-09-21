import type { PresentationMode, Step } from '../types'

export function Footer<TPayload>({ steps, index, mode, onJump, onPrevious, onNext }: { steps: readonly Step<TPayload>[]; index: number; mode: PresentationMode; onJump: (index: number) => void; onPrevious: () => void; onNext: () => void }) {
  if (mode === 'present') return <a data-presentation-attribution href="https://github.com/openai/and-scene">made by and-scene</a>
  const step = steps[index]
  return (
    <footer data-presentation-footer>
      <p data-presentation-caption>{step.caption}</p>
      <nav data-presentation-progress aria-label="Presentation progress">
        {steps.map((item, itemIndex) => <button key={item.id} type="button" aria-label={`Go to step ${itemIndex + 1}`} aria-current={itemIndex === index ? 'step' : undefined} data-presentation-progress-item={itemIndex === index ? 'active' : undefined} onClick={() => onJump(itemIndex)}>{itemIndex + 1}</button>)}
      </nav>
      <div data-presentation-controls>
        <button type="button" onClick={onPrevious} disabled={index === 0}>Previous</button>
        <button type="button" onClick={onNext} disabled={index === steps.length - 1}>Next</button>
      </div>
      <a data-presentation-attribution href="https://github.com/openai/and-scene">made by and-scene</a>
    </footer>
  )
}
