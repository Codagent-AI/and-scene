import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(cleanup)
Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn((query: string) => ({ matches: query.includes('1100'), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) })
