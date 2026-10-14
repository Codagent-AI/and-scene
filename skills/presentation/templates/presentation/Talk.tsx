import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

const TITLE = '{{TITLE}}'

export default function Talk() {
  return (
    <div className="{{SLUG}}">
      <Presentation steps={STEPS} title={TITLE} initialMode="browse" />
    </div>
  )
}
