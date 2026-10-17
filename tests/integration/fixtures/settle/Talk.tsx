import { Presentation } from '../../presentation-kit/index.ts'
import { Plain } from '../_shared/scenes.tsx'
import { twoSteps } from '../_shared/steps.ts'
import '../_shared/active.css'
import '../_shared/attribution.css'
import './settle.css'

export default function Talk() {
  return (
    <>
      <div className="settle-overlay" />
      <Presentation steps={twoSteps(Plain)} title="settle" />
    </>
  )
}
