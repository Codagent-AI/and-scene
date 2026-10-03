import { Presentation } from '../../presentation-kit/index.js'
import { PRESENTATION_TITLE, STEPS } from './steps.js'
import './style.css'

export default function Talk() {
  return <Presentation steps={STEPS} title={PRESENTATION_TITLE} initialMode="browse" className="sample-presentation" branding={<span className="presentation-brand">AND SCENE / FIELD NOTES</span>} />
}
