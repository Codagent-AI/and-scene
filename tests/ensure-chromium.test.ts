import { describe, expect, it } from 'vitest'
import { ensureChromiumInstalled } from '../scripts/chromium.mjs'

describe('Playwright browser provisioning', () => {
  it('installs Chromium when the executable is absent', async () => {
    const installed: string[] = []
    await ensureChromiumInstalled({
      executablePath: '/missing/chromium',
      exists: () => false,
      install: (executablePath) => { installed.push(executablePath) },
    })
    expect(installed).toEqual(['/missing/chromium'])
  })
})
