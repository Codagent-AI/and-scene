import { Presentation as ScenePresentation } from '../../presentation-kit'
import { STEPS } from './steps/steps'
import './talk.css'

/** Replace the example narration and scene content with the requested story. */
export default function Talk() {
  return <main className="starter-presentation"><ScenePresentation steps={STEPS} title="Presentation title" initialMode="browse" /></main>
}
