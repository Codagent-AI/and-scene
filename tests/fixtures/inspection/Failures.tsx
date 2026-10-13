import { useEffect } from 'react'

export function MissingHooks() {
  return <main>Missing step hooks</main>
}

export function StalledNavigation() {
  return <main data-step-count="2" data-step-index="0">Navigation never advances</main>
}

export function CrashingScene() {
  useEffect(() => {
    const timer = setTimeout(() => { throw new Error('injected inspection crash') }, 100)
    return () => clearTimeout(timer)
  }, [])
  return <main data-step-count="1" data-step-index="0">Crashing scene</main>
}
