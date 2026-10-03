import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

export async function ensureChromiumInstalled({ executablePath = chromium.executablePath(), exists = existsSync, install } = {}) {
  if (exists(executablePath)) return
  if (install) {
    await install(executablePath)
    return
  }
  const result = spawnSync('npx', ['playwright', 'install', 'chromium'], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Playwright Chromium installation failed with status ${result.status}`)
}
