import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

export default function Talk() {
  return <Presentation className="p-example" steps={STEPS} title={"Example presentation"} initialMode="browse" />
}
