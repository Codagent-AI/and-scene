import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps.ts'
import './styles.css'

export default function Talk() {
  return (
    <div className="p-{{slug}}">
      <Presentation steps={STEPS} title="{{title}}" initialMode="browse" />
    </div>
  )
}
