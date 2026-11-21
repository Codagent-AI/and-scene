import { Appear, Label, SceneLayer } from '../../../presentation-kit'
import { entities } from '../entities'

export default function OpeningScene() {
  return (
    <SceneLayer>
      <Appear style={{ position: 'absolute', left: '10%', top: '20%' }}>
        <Label layoutId={entities.subject}>Introduce the subject</Label>
      </Appear>
    </SceneLayer>
  )
}
