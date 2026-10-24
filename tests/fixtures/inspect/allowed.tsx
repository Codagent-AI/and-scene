import './polished.css'
import './attribution-style.css'
import { Fixture } from './common.tsx'
import type { Item } from './common.tsx'

const stack: Item[] = [
  { id: 'under', text: 'Stacked under', x: 60, y: 60, allow: true },
  { id: 'over', text: 'Stacked over', x: 70, y: 66, allow: true },
]
const loose: Item[] = [
  { id: 'gamma', text: 'Gamma text', x: 300, y: 200 },
  { id: 'delta', text: 'Delta text', x: 310, y: 205 },
]

export default function Talk() {
  return <Fixture className="fx" frames={[[], stack, [...stack, ...loose]]} />
}
