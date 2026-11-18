import { Presentation } from '../../presentation-kit'
import { TITLE } from './outline'
import { STEPS } from './steps'
import './presentation.css'
export default function Talk() {
  return <Presentation steps={STEPS} title={TITLE} initialMode="browse" className="how-to-scene" />
}
