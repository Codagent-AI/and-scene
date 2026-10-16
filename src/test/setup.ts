import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { MotionGlobalConfig } from 'motion/react'

// jsdom cannot run real layout animations; make them resolve instantly.
MotionGlobalConfig.skipAnimations = true

afterEach(() => cleanup())
