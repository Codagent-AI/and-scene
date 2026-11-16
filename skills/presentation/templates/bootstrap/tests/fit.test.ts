import {expect,it} from 'vitest'
import {fitScale} from '../src/presentation-kit/useFitScale'
it('fits the design canvas',()=>expect(fitScale(390,844,'browse')).toBeGreaterThan(0))
