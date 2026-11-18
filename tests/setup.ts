import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(() => { cleanup(); window.innerWidth = 1440; window.innerHeight = 900 })
window.innerWidth = 1440
window.innerHeight = 900
