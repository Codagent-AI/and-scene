import { describe, expect, it, vi } from 'vitest'
import { launchChromium } from '../../scripts/lib/preview.mjs'

const MISSING = new Error("browserType.launch: Executable doesn't exist at /cache/chromium/chrome")
const browser = { name: 'browser' }

/** A stand-in for `import('playwright')` whose launches follow the scripted outcomes. */
const playwright = (...outcomes) => {
  const launch = vi.fn(async () => {
    const next = outcomes.shift()
    if (next instanceof Error) throw next
    return next
  })
  return { launch, load: async () => ({ chromium: { launch } }) }
}

describe('launchChromium', () => {
  it('launches without installing when the browser is present', async () => {
    const { launch, load } = playwright(browser)
    const install = vi.fn()
    await expect(launchChromium({ root: '/app', load, install })).resolves.toBe(browser)
    expect(install).not.toHaveBeenCalled()
    expect(launch).toHaveBeenCalledTimes(1)
  })

  it('installs a missing Chromium in the project and retries once', async () => {
    const { launch, load } = playwright(MISSING, browser)
    const install = vi.fn(async () => true)
    await expect(launchChromium({ root: '/app', load, install })).resolves.toBe(browser)
    expect(install).toHaveBeenCalledExactlyOnceWith('/app')
    expect(launch).toHaveBeenCalledTimes(2)
  })

  it('reports the manual command when the automatic install fails, without retrying', async () => {
    const { launch, load } = playwright(MISSING)
    await expect(launchChromium({ root: '/app', load, install: async () => false })).rejects.toThrow(/automatic install failed.*npx playwright install chromium/)
    expect(launch).toHaveBeenCalledTimes(1)
  })

  it('does not loop when Chromium is still missing after the install', async () => {
    const { launch, load } = playwright(MISSING, MISSING)
    const install = vi.fn(async () => true)
    await expect(launchChromium({ root: '/app', load, install })).rejects.toThrow(/still unavailable/)
    expect(install).toHaveBeenCalledTimes(1)
    expect(launch).toHaveBeenCalledTimes(2)
  })

  it('does not install for unrelated launch failures', async () => {
    const boom = new Error('browser crashed')
    const { load } = playwright(boom)
    const install = vi.fn()
    await expect(launchChromium({ root: '/app', load, install })).rejects.toBe(boom)
    expect(install).not.toHaveBeenCalled()
  })
})
