import type { StepMeta, PresentationMode } from '../types';
export function Footer({ steps, index, mode, jump, next, prev }: {
    steps: readonly StepMeta[];
    index: number;
    mode: PresentationMode;
    jump: (index: number) => void;
    next: () => void;
    prev: () => void;
}) {
    return <footer data-presentation-footer style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>{mode === 'browse' && <><p data-presentation-caption>{steps[index].caption}</p><nav data-presentation-progress aria-label="Steps">{steps.map((step, i) => <button key={step.id} data-presentation-progress-item data-presentation-active={i === index ? 'true' : undefined} aria-current={i === index ? 'step' : undefined} aria-label={`Go to step ${i + 1}: ${step.title}`} onClick={() => jump(i)}>{i + 1}</button>)}</nav><button data-presentation-prev aria-label="Previous step" disabled={index === 0} onClick={prev}>Previous</button><button data-presentation-next aria-label="Next step" disabled={index === steps.length - 1} onClick={next}>Next</button></>}</footer>;
}
