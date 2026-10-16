import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps.ts'
import './styles.css'

export default function Talk() {
  return (
    <div className="p-getting-started">
      <Presentation steps={STEPS} title="Getting Started" initialMode="browse" />
    </div>
  )
}
