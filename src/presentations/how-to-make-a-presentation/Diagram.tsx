import type { ReactNode } from 'react'
import { Appear, SceneLayer, type SceneProps } from '../../presentation-kit'
import { beats } from './beats'

export interface DiagramPayload {
  /** One-based beat; the scene shows every beat up to and including this one. */
  beat: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
}

/** Continuing entities render bare (they morph); only the newest beat's entities fade in. */
function Enter({ fresh, children }: { fresh: boolean; children: ReactNode }) {
  return fresh ? <Appear>{children}</Appear> : <>{children}</>
}

/** The one persistent scene instance shared by all nine steps. */
export function Diagram({ payload }: SceneProps<DiagramPayload>) {
  return (
    <SceneLayer name="how-to-make-a-presentation" className="htp-scene">
      {beats.slice(0, payload.beat).map((Beat, i) => (
        <Enter key={i} fresh={i + 1 === payload.beat}>
          <Beat beat={payload.beat} />
        </Enter>
      ))}
    </SceneLayer>
  )
}
