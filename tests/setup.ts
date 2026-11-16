import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(cleanup)
if (typeof window !== 'undefined') Object.defineProperty(window, 'matchMedia', { value: (query: string) => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) })
