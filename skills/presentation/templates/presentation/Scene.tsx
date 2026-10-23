import { Arrow, Box, Label, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import type { EntitySpec } from './entities'
import type { ScenePayload } from './types'

function renderEntity({ id, kind, className, text, from, to, ...box }: EntitySpec) {
  if (kind === 'arrow') return <Arrow key={id} id={id} className={className} appear from={from!} to={to!} />
  const Node = kind === 'label' ? Label : Box
  return (
    <Node key={id} id={id} className={className} appear {...box}>
      {text}
    </Node>
  )
}

/** One persistent scene: it renders whichever entities the active step lists. */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return <SceneLayer>{payload.entities.map(renderEntity)}</SceneLayer>
}
