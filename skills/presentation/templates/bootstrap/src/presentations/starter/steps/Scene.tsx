import { Arrow, Box, SceneLayer, type SceneProps } from '../../../presentation-kit'
import { E } from '../entities'

/**
 * One persistent scene: later steps only add entities, so earlier ones never move.
 * Every direct child of <SceneLayer> needs a `key` (use the entity id) so entering and
 * leaving entities are tracked individually.
 */
export function StarterScene({ stepIndex }: SceneProps) {
  return (
    <SceneLayer>
      <Box key={E.idea} id={E.idea} x={40} y={150} w={160} h={80} label="Idea" emphasis={stepIndex === 0} />
      {stepIndex >= 1 ? <Arrow key={E.ideaToScene} id={E.ideaToScene} from={[200, 190]} to={[360, 190]} /> : null}
      {stepIndex >= 1 ? (
        <Box key={E.scene} id={E.scene} x={360} y={150} w={160} h={80} label="Scene" emphasis={stepIndex === 1} />
      ) : null}
      {stepIndex >= 2 ? <Arrow key={E.sceneToTalk} id={E.sceneToTalk} from={[520, 190]} to={[680, 190]} /> : null}
      {stepIndex >= 2 ? (
        <Box key={E.talk} id={E.talk} x={680} y={150} w={160} h={80} label="Presentation" emphasis={stepIndex === 2} />
      ) : null}
    </SceneLayer>
  )
}
