import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export const HOST = '127.0.0.1'
export const SETTLE_MS = 850
export function build(cwd = process.cwd()) {
  return new Promise((resolveBuild, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
    const timer = setTimeout(() => child.kill('SIGTERM'), 120000)
    child.on('error', reject)
    child.on('exit', code => { clearTimeout(timer); code === 0 ? resolveBuild() : reject(new Error(`build: npm run build exited ${code}`)) })
  })
}
async function freePort() {
  const server = createServer()
  server.listen(0, HOST)
  await once(server, 'listening')
  const port = server.address().port
  await new Promise(r => server.close(r))
  return port
}
export async function withPreview(run, { cwd = process.cwd() } = {}) {
  const port = await freePort()
  const base = `http://${HOST}:${port}`
  const child = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', d => { output += d })
  child.stderr.on('data', d => { output += d })
  let browser
  const stop = () => child.kill('SIGTERM')
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
  try {
    let ready = false
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(`preview: exited ${child.exitCode}: ${output}`)
      try { ready = (await fetch(base)).ok } catch { /* wait for server */ }
      if (ready) break
      await new Promise(r => setTimeout(r, 50))
    }
    if (!ready) throw new Error(`preview: readiness timeout at ${base}: ${output}`)
    console.log(`preview: host/probe/browser ${base}`)
    browser = await chromium.launch({ headless: true })
    return await run(browser, base)
  } finally {
    await browser?.close()
    if (child.exitCode === null) {
      const exited = once(child, 'exit')
      stop()
      const kill = setTimeout(() => child.kill('SIGKILL'), 2000)
      await exited
      clearTimeout(kill)
    }
    process.removeListener('SIGTERM', stop)
    process.removeListener('SIGINT', stop)
    console.log('preview: cleaned up')
  }
}
export async function visitSteps(page, url, onStep, { expectedCount, settle = SETTLE_MS } = {}) {
  let index = 0
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(url)
    const root = page.locator('[data-presentation-root]')
    await root.waitFor({ timeout: 5000 })
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1 || (expectedCount && count !== expectedCount)) throw new Error(`sample: invalid step count ${count}, expected ${expectedCount ?? 'positive integer'}`)
    for (index = 0; index < count; index++) {
      if (index > 0) await page.keyboard.press('ArrowRight')
      await page.waitForFunction(i => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3000 })
      await page.waitForTimeout(settle)
      if (errors.length) throw new Error(errors.join('; '))
      await onStep(index, root)
      console.log(`render: step ${index} clean`)
    }
  } catch (error) {
    throw new Error(`render: step ${index}: ${error.message}`, { cause: error })
  }
}
