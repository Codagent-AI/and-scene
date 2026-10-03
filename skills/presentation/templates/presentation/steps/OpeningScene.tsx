import { entities } from '../entities'

export default function OpeningScene() {
  return <div className="scene-layer">
    <div className="example-entity" data-entity-id={entities.subject}>A central idea</div>
  </div>
}
