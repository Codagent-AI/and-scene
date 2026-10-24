import './polished.css'
import { A, Fixture } from './common.tsx'

// polished active chrome, but the default attribution link is left unstyled
export default function Talk() {
  return <Fixture className="fx" frames={[[A], [A], [A]]} />
}
