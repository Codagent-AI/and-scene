import { describe, expect, it } from 'vitest'
import { findPresentation, presentations } from './index'

describe('presentations registry', () => {
  it('registers the committed reference sample', () => {
    const entry = findPresentation('how-to-make-a-presentation')
    expect(entry).toBeDefined()
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('can load the reference sample as a default-exported component', async () => {
    const entry = findPresentation('how-to-make-a-presentation')
    const mod = await entry!.load()
    expect(typeof mod.default).toBe('function')
  })

  it('leaves the registry array containing exactly this one entry so far', () => {
    expect(presentations).toHaveLength(1)
  })
})
