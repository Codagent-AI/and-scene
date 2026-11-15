import { useEffect, useState } from 'react'
import { ENTER_DELAY, ENTER_T } from '../../../presentation-kit/constants'

export function Verification() {
  const [passed, setPassed] = useState(false)
  useEffect(() => {
    // Let the newly entering node show its checks before resolving, within the
    // screenshot helper's settle window. Continuing beats retain this instance.
    const timer = window.setTimeout(() => setPassed(true), (ENTER_DELAY + ENTER_T * 0.8) * 1000)
    return () => window.clearTimeout(timer)
  }, [])
  return <span data-sample-verification={passed ? 'passed' : 'checking'}>{passed ? '✓ build + render' : 'build · render …'}</span>
}
