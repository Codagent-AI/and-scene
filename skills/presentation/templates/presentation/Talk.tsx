import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps/index.ts'
import './__SLUG__.css'

export const TITLE = '__TITLE__'

export default function Talk() {
  return (
    <div className="__CLASS__">
      <Presentation steps={STEPS} title={TITLE} initialMode="browse" />
    </div>
  )
}
