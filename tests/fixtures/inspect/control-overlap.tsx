import './polished.css'
import './control-overlap.css'
import { A, Fixture } from './common.tsx'

// Label text never touches another label, yet the attribution control's box covers the footer controls.
export default function Talk() {
  return <Fixture className="fx fxo" frames={[[A], [A], [A]]} />
}
