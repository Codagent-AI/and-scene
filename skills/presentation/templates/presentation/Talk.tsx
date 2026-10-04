import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  return <div className="{{SLUG_CLASS}}"><Presentation steps={STEPS} title="{{PRESENTATION_TITLE}}" initialMode="browse" /></div>
}
