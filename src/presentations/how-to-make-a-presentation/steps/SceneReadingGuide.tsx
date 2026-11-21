import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'

export function SceneReadingGuide({ beat }: { beat: number }) {
  const [stage, setStage] = useState<HTMLElement | null>(null)
  const findStage = useCallback((anchor: HTMLSpanElement | null) => {
    setStage(anchor?.closest<HTMLElement>('[data-presentation-stage]') ?? null)
  }, [])

  return <>
    <span hidden ref={findStage} />
    {stage && createPortal(
      <aside className="scene-reading-guide" aria-label="Diagram details">
        <h2>Diagram details</h2>
        <dl>
          <div>
            <dt>Conversation</dt>
            <dd>
              You bring a topic{beat >= 2 ? ' ↔ the presentation skill asks one question at a time.' : '.'}
            </dd>
          </div>
          {beat >= 3 && <div>
            <dt>Step cards</dt>
            <dd>
              A holds the title, caption, and visual.
              {beat >= 4 && ' A → B → C carry changing positions and labels.'}
              {beat >= 5 && ' The dashed card is unspecified. You choose partial or full detail.'}
            </dd>
          </div>}
          {beat >= 6 && <div>
            <dt>Shared scene kit</dt>
            <dd>Boxes, arrows, and motion.{beat >= 7 && ' Verify checks the build and render. Both pass.'}</dd>
          </div>}
          {beat >= 8 && <div>
            <dt>Edit request</dt>
            <dd>The return arrow points to the edited card B.</dd>
          </div>}
          {beat >= 9 && <div>
            <dt>Reveal</dt>
            <dd>Made exactly this way.</dd>
          </div>}
        </dl>
      </aside>,
      stage,
    )}
  </>
}
