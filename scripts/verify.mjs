import { spawn } from 'node:child_process'
import { once } from 'node:events'
import net from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { chromium } from 'playwright'
import { parseArgs, validateSample } from './verification-lib.mjs'

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
export async function main({ root, slug, port: requestedPort }) {
  let browser; let preview; let build; let phase = 'build'; let step = 0
  const terminate = async (child) => { if (child && child.exitCode === null) { child.kill('SIGTERM'); await Promise.race([once(child, 'exit'), delay(3000)]); if (child.exitCode === null) child.kill('SIGKILL') } }
  const cleanup = async () => { await browser?.close().catch(() => {}); await Promise.all([terminate(preview), terminate(build)]) }
  process.once('SIGINT', () => { process.exitCode = 130; void cleanup() })
  try {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    build = spawn(npmCommand, ['run', 'build'], { cwd: root, stdio: 'inherit' })
    const [code] = await once(build, 'exit'); if (code !== 0) throw new Error('npm run build failed')
    phase = 'sample-registration'; const total = await validateSample(root, slug)
    phase = 'render'; const port = requestedPort || await freePort(); const base = `http://127.0.0.1:${port}`
    preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] })
    await waitReady(base, preview)
    try { browser = await chromium.launch({ headless: true }) } catch (error) { throw new Error(`Playwright Chromium unavailable; run "npx playwright install chromium": ${error.message}`) }
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const faults = []
    page.on('console', (msg) => { if (msg.type() === 'error') faults.push(`console error: ${msg.text()}`) })
    page.on('pageerror', (error) => faults.push(`page error: ${error.message}`))
    await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    if (count !== total) throw new Error(`step ${step}: expected ${total} rendered steps, found ${count}`)
    for (step = 0; step < total; step++) {
      if (step) await page.keyboard.press('ArrowRight')
      await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, step, { timeout: 5000 }).catch(() => { throw new Error(`step ${step}: transition did not advance data-step-index`) })
      await page.waitForTimeout(650)
      const title = await page.locator('[data-presentation-caption] h2').textContent().catch(() => '')
      const expected = (await import('./verification-lib.mjs')).expectedSteps[step][1]
      if (!title?.includes(expected)) throw new Error(`step ${step}: expected title "${expected}", got "${title}"`)
      if (faults.length) throw new Error(`step ${step}: ${faults.join('; ')}`)
    }
    phase = 'complete'; console.log(`PASS: build, sample registration, and render verification (${total} steps)`)
  } catch (error) { console.error(`FAIL [${phase}]${phase === 'render' ? ` step ${step}` : ''}: ${error.message}`); process.exitCode = 1 }
  finally { await cleanup() }
}
if (import.meta.url === pathToFileURL(path.resolve(process.argv[1] || '')).href) main(parseArgs(process.argv.slice(2)))
