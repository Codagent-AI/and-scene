import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(cleanup)
Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockImplementation(query => ({ matches: query.includes('1100'), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) })
class TestResizeObserver { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', TestResizeObserver)

beforeEach(() => { vi.mocked(window.matchMedia).mockImplementation(query => ({ matches: query.includes('1100'), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList) })
