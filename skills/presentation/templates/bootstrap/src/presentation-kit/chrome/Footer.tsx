import type { Mode, Step } from '../types'

export interface FooterProps<TPayload> {
  mode: Mode
  activeStep: Step<TPayload>
  stepIndex: number
  stepCount: number
  onNext: () => void
  onPrev: () => void
  onGoTo: (index: number) => void
  onToggleMode: () => void
}

export const AND_SCENE_REPO_URL = 'https://github.com/Codagent-AI/and-scene'

export function Footer<TPayload>({
  mode,
  activeStep,
  stepIndex,
  stepCount,
  onNext,
  onPrev,
  onGoTo,
  onToggleMode,
}: FooterProps<TPayload>) {
  return (
    <footer
      className="and-scene-footer"
      data-presentation-footer=""
      data-presentation-mode={mode}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
    >
      {mode === 'browse' ? (
        <>
          <p className="and-scene-caption" data-presentation-caption="">
            {activeStep.caption}
          </p>
          <nav className="and-scene-progress" data-presentation-progress="" aria-label="Step progress">
            {Array.from({ length: stepCount }, (_, index) => {
              const isActive = index === stepIndex
              return (
                <button
                  key={index}
                  type="button"
                  className="and-scene-progress-dot"
                  data-presentation-progress-dot=""
                  data-active={isActive}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Go to step ${index + 1}`}
                  onClick={() => onGoTo(index)}
                />
              )
            })}
          </nav>
          <div className="and-scene-nav-controls" data-presentation-controls="">
            <button
              type="button"
              className="and-scene-prev"
              data-presentation-prev=""
              onClick={onPrev}
              disabled={stepIndex === 0}
            >
              Prev
            </button>
            <button
              type="button"
              className="and-scene-next"
              data-presentation-next=""
              onClick={onNext}
              disabled={stepIndex === stepCount - 1}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
      <button
        type="button"
        className="and-scene-mode-toggle"
        data-presentation-mode-toggle=""
        onClick={onToggleMode}
      >
        {mode === 'browse' ? 'Present' : 'Browse'}
      </button>
      <a
        className="and-scene-attribution"
        data-presentation-attribution=""
        href={AND_SCENE_REPO_URL}
        target="_blank"
        rel="noreferrer"
        style={{ position: 'absolute', right: 0, bottom: 0 }}
      >
        made by and-scene
      </a>
    </footer>
  )
}
