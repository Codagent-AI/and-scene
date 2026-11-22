import { Presentation } from '../../presentation-kit'
import { STEPS, TITLE } from './steps'
import './presentation.css'

export default function Talk() {
  return <div className="how-to-presentation"><Presentation steps={STEPS} title={TITLE} initialMode="browse" /></div>
}
