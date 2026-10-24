import './polished.css'
import './attribution-style.css'
import { A, Fixture } from './common.tsx'

export default function Talk() {
  return <Fixture className="fx" frames={[[A], [A, { id: 'mover', text: 'Mover', x: 300, y: 200, slide: true }], [A]]} />
}
