import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(cleanup)

if (!Range.prototype.getClientRects) Range.prototype.getClientRects = () => [] as unknown as DOMRectList
