import { afterEach } from 'vitest'

// Unmount rendered trees after each test, so animation work cannot outlive the jsdom environment.
if (typeof document !== 'undefined') {
  const { cleanup } = await import('@testing-library/react')
  afterEach(cleanup)
}
