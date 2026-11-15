import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(cleanup)
vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
