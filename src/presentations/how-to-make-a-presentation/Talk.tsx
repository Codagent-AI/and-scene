import { Presentation } from '../../presentation-kit/Presentation'
import { STEPS, TITLE } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation steps={STEPS} title={TITLE} initialMode="browse" className="how-to-presentation" />
}
