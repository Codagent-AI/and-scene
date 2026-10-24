import './polished.css'
import './attribution-style.css'
import { A, B_FAR, B_ON_A, Fixture } from './common.tsx'

export default function Talk() {
  return <Fixture className="fx" frames={[[A], [A, B_ON_A], [A, B_FAR]]} />
}
