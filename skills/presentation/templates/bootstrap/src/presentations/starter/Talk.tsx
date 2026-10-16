import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

export default function Talk() {
  return (
    <div className="p-starter">
      <Presentation steps={STEPS} title="Starter presentation" initialMode="browse" />
    </div>
  )
}
