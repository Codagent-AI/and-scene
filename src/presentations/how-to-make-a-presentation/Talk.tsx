import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import { SAMPLE_TITLE } from './meta'
import './talk.css'

export default function Talk() {
  return <Presentation steps={STEPS} title={SAMPLE_TITLE} initialMode="browse" className="talk-sample" />
}
