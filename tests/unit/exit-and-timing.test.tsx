import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ENTER_DELAY, ENTER_T, SETTLE_MS as KIT_SETTLE_MS, Presentation } from '../../src/presentation-kit/index.ts'
import { STEPS as SAMPLE_STEPS } from '../../src/presentations/how-to-make-a-presentation/steps/index.ts'
import { STEPS as STARTER_STEPS } from '../../skills/presentation/templates/bootstrap/src/presentations/starter/steps.ts'
// @ts-expect-error plain JS module without types
import { SETTLE_MS as SCRIPT_SETTLE_MS } from '../../scripts/preview.mjs'

const entity = (id: string) => document.querySelector(`[data-presentation-entity="${id}"]`)
const press = (key: string) => fireEvent.keyDown(window, { key })

describe('departing entities in real compositions', () => {
  it('sample: boxes and arrows animate out instead of vanishing when going back', async () => {
    render(<Presentation steps={SAMPLE_STEPS} title="T" initialMode="browse" />)
    press('ArrowRight')
    await waitFor(() => expect(entity('htmp/conversation')).not.toBeNull())
    expect(entity('htmp/skill/slot')).not.toBeNull()
    press('ArrowLeft')
    expect(entity('htmp/conversation')).not.toBeNull()
    expect(entity('htmp/skill/slot')).not.toBeNull()
    await waitFor(() => expect(entity('htmp/conversation')).toBeNull(), { timeout: 3000 })
    await waitFor(() => expect(entity('htmp/skill/slot')).toBeNull(), { timeout: 3000 })
  })

  it('generated presentation template: boxes and arrows animate out when going back', async () => {
    render(<Presentation steps={STARTER_STEPS} title="T" initialMode="browse" />)
    press('ArrowRight')
    await waitFor(() => expect(entity('starter/link')).not.toBeNull())
    press('ArrowLeft')
    expect(entity('starter/link')).not.toBeNull()
    expect(entity('starter/detail/slot')).not.toBeNull()
    await waitFor(() => expect(entity('starter/link')).toBeNull(), { timeout: 3000 })
    await waitFor(() => expect(entity('starter/detail/slot')).toBeNull(), { timeout: 3000 })
  })
})

describe('settle timing', () => {
  it('the scripts wait at least as long as the kit needs to finish entering', () => {
    expect(KIT_SETTLE_MS).toBeGreaterThanOrEqual((ENTER_DELAY + ENTER_T) * 1000)
    expect(SCRIPT_SETTLE_MS).toBeGreaterThanOrEqual(KIT_SETTLE_MS)
  })
})
