import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export const SETTLE_MS = 850
export async function command(program, args, cwd = process.cwd()) {
  const child = spawn(program, args, { cwd, stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`${program} ${args.join(' ')} exited ${code}`)
}
async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}
export async function withBrowser(run, { cwd = process.cwd(), viewport = { width: 1440, height: 900 } } = {}) {
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = '', browser
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  const closed = once(child, 'exit')
  let cleaned = false
  async function cleanup() {
    if (cleaned) return
    cleaned = true
    await browser?.close()
    if (child.exitCode === null) { child.kill('SIGTERM'); await closed }
    console.log(`CLEANUP preview ${port}`)
  }
  const interrupt = () => { void cleanup().finally(() => process.exit(130)) }
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt)
  try {
    for (let attempts = 0; ; attempts++) {
      if (child.exitCode !== null) throw new Error(`Preview exited: ${output}`)
      try { if ((await fetch(url)).ok) break } catch { /* readiness retry */ }
      if (attempts >= 100) throw new Error(`Preview readiness failed: ${output}`)
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    console.log(`PREVIEW ${url} (host/readiness/browser IPv4)`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    return await run(page, url)
  } finally {
    await cleanup()
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt)
  }
}
export async function walkSteps(page, url, route, visit, { first = false, settle = SETTLE_MS } = {}) {
  const errors = []
  let index = 0
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(`${url}/${route}`, { waitUntil: 'networkidle' })
    await page.locator('[data-step-count]').waitFor({ timeout: 5000 })
    const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('Invalid step count')
    for (index = 0; index < (first ? 1 : count); index++) {
      if (index) {
        await page.locator('body').click({ position: { x: 2, y: 2 } })
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(i => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(i), index, { timeout: 2500 })
      }
      const stepObservedAt = Date.now()
      const settleStartedAt = Date.now()
      await page.waitForTimeout(settle)
      if (Number(await page.locator('[data-step-index]').getAttribute('data-step-index')) !== index) throw new Error('Unexpected step index')
      if (errors.length) throw new Error(errors.join('; '))
      await visit(page, index, count, { stepObservedAt, settleStartedAt })
      console.log(`STEP ${index} OK`)
    }
    if (errors.length) throw new Error(errors.join('; '))
    return count
  } catch (error) { throw new Error(`step ${index}: ${error.message}`, { cause: error }) }
}
