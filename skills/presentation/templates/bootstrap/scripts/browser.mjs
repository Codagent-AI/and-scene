/* global document */
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export const SETTLE_MS = 1000
export async function command(command, args, cwd = process.cwd()) {
  const child = spawn(command, args, { cwd, stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`build: ${command} ${args.join(' ')} exited ${code}`)
}
async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise((done) => server.close(done))
  return port
}
export async function withPreview(run, { cwd = process.cwd(), viewport = { width: 1440, height: 900 } } = {}) {
  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  server.stdout.on('data', (s) => { output += s })
  server.stderr.on('data', (s) => { output += s })
  let browser
  try {
    let ready = false
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error(`preview: exited early ${output}`)
      try { ready = (await fetch(origin)).ok } catch { /* readiness retry */ }
      if (ready) break
      await new Promise((done) => setTimeout(done, 100))
    }
    if (!ready) throw new Error(`preview: readiness failed for ${origin}: ${output}`)
    console.log(`preview: host=127.0.0.1 readiness=${origin} browser=${origin}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    return await run({ page, origin })
  } finally {
    await browser?.close()
    if (server.exitCode === null) {
      const exited = once(server, 'exit')
      server.kill('SIGTERM')
      await exited
    }
    console.log(`preview: cleaned up ${port}`)
  }
}
export async function visitSteps(page, url, each, { settle = SETTLE_MS } = {}) {
  let step = 0
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    await page.goto(url)
    const root = page.locator('[data-step-count][data-step-index]')
    await root.waitFor({ timeout: 10000 })
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('invalid step-count hook')
    for (step = 0; step < count; step++) {
      await page.waitForFunction((index) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(index), step, { timeout: 3000 })
      await page.waitForTimeout(settle)
      if (errors.length) throw new Error(errors.join('; '))
      await each({ page, step, count })
      console.log(`render: step ${step}/${count - 1} passed`)
      if (step < count - 1) await page.keyboard.press('ArrowRight')
    }
    if (errors.length) throw new Error(errors.join('; '))
  } catch (error) {
    throw new Error(`render: step ${step}: ${error.message}`, { cause: error })
  }
}
