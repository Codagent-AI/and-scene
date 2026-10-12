import { spawn } from 'node:child_process'
import { once } from 'node:events'
import net from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { chromium } from 'playwright'
import { parseArgs, validateRegistration, validateSample } from './verification-lib.mjs'

export async function freePort() {
  const server = net.createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const { port } = server.address(); await new Promise((resolve) => server.close(resolve)); return port
}
export async function waitReady(url, child, timeout = 30000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    if (child.exitCode !== null) throw new Error('preview exited before becoming ready')
    try { const response = await fetch(url); if (response.ok) return } catch {}
    await delay(200)
  }
  throw new Error('preview readiness timed out')
}
export async function main({ root, slug, port: requestedPort, generic = false }) {
  let browser; let preview; let build; let phase = 'build'; let step = 0
  const terminate = async (child) => { if (child && child.exitCode === null) { child.kill('SIGTERM'); await Promise.race([once(child, 'exit'), delay(3000)]); if (child.exitCode === null) child.kill('SIGKILL') } }
  const cleanup = async () => { await browser?.close().catch(() => {}); await Promise.all([terminate(preview), terminate(build)]) }
  process.once('SIGINT', () => { process.exitCode = 130; void cleanup() })
  try {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    build = spawn(npmCommand, ['run', 'build'], { cwd: root, stdio: 'inherit' })
    const [code] = await once(build, 'exit'); if (code !== 0) throw new Error('npm run build failed')
    phase = 'sample-registration'; const expectedTotal = generic ? (await validateRegistration(root, slug), null) : await validateSample(root, slug)
    phase = 'render'; const port = requestedPort || await freePort(); const base = `http://127.0.0.1:${port}`
    preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] })
    await waitReady(base, preview)
    try { browser = await chromium.launch({ headless: true }) } catch (error) { throw new Error(`Playwright Chromium unavailable; run "npx playwright install chromium": ${error.message}`) }
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const faults = []
    page.on('console', (msg) => { if (msg.type() === 'error') faults.push(`console error: ${msg.text()}`) })
    page.on('pageerror', (error) => faults.push(`page error: ${error.message}`))
    await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
    if (faults.length) throw new Error(faults.join('; '))
    const countAttribute = await page.locator('[data-step-count]').getAttribute('data-step-count', { timeout: 3000 }).catch(() => {
      if (faults.length) throw new Error(faults.join('; '))
      throw new Error('rendered sample did not expose data-step-count')
    })
    const count = Number(countAttribute)
    const total = expectedTotal ?? count
    if (!Number.isInteger(count) || count < 1 || count !== total) throw new Error(`expected ${total} rendered steps, found ${count}`)
    for (step = 0; step < total; step++) {
      if (step) await page.keyboard.press('ArrowRight')
      await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, step, { timeout: 5000 }).catch(() => { throw new Error('transition did not advance data-step-index') })
      await page.waitForTimeout(650)
      const title = await page.locator('[data-presentation-caption] h2').textContent().catch(() => '')
      if (!title) throw new Error(`step ${step + 1} did not expose a caption title`)
      if (!generic) {
        const expected = (await import('./verification-lib.mjs')).expectedSteps[step][1]
        if (!title.includes(expected)) throw new Error(`expected title "${expected}", got "${title}"`)
      }
      if (faults.length) throw new Error(faults.join('; '))
    }
    phase = 'complete'; console.log(`PASS: build, sample registration, and render verification (${total} steps)`)
  } catch (error) { console.error(`FAIL [${phase}]${phase === 'render' ? ` step ${step}` : ''}: ${error.message}`); process.exitCode = 1 }
  finally { await cleanup() }
}
if (import.meta.url === pathToFileURL(path.resolve(process.argv[1] || '')).href) main(parseArgs(process.argv.slice(2)))
