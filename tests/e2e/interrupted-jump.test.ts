import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import net from 'node:net'
import { chromium, type Browser } from 'playwright'

// Regression for an interrupted newcomer fade: jumping to a late step and returning before the
// delayed fade runs must leave every scene entity visible. Browser-backed; run via
// `npm run test:integration -- tests/e2e/interrupted-jump`.

const REPO = process.cwd()
const SLUG = 'how-to-make-a-presentation'

let preview: ChildProcess | undefined
let browser: Browser | undefined
let url = ''

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo
      server.close(() => resolve(port))
    })
  })
}

async function waitForServer(address: string): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(address)).ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`preview did not start at ${address}`)
}

beforeAll(async () => {
  execFileSync('npm', ['run', 'build'], { cwd: REPO, stdio: 'pipe', timeout: 240_000 })
  const port = await freePort()
  preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: REPO,
    stdio: 'ignore',
  })
  url = `http://127.0.0.1:${port}/${SLUG}`
  await waitForServer(url)
  browser = await chromium.launch()
})

afterAll(async () => {
  await browser?.close()
  preview?.kill()
})

describe('interrupted direct jump', () => {
  it.each([
    [9, 8],
    [9, 5],
  ])('jumping to step %i and returning to step %i quickly leaves the whole scene visible', async (from, back) => {
    const page = await browser!.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(url)
    await page.waitForSelector('[data-step-index]')
    await page.getByRole('button', { name: new RegExp(`^Step ${from}:`) }).click()
    await page.waitForTimeout(80)
    await page.getByRole('button', { name: new RegExp(`^Step ${back}:`) }).click()
    await page.waitForTimeout(2000)
    const result = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll<HTMLElement>('[data-presentation-scene] [data-presentation-id]')]
      return {
        index: document.querySelector<HTMLElement>('[data-step-index]')?.dataset.stepIndex,
        invisible: nodes.filter((n) => getComputedStyle(n).opacity === '0').map((n) => n.dataset.presentationId),
      }
    })
    await page.close()
    expect(result.index).toBe(String(back - 1))
    expect(result.invisible).toEqual([])
  })
})
