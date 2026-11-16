import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
export const ROOT = fileURLToPath(new URL('../', import.meta.url))
export const HOST = '127.0.0.1'
export const SETTLE_MS = 900
export async function command(program, args, cwd = ROOT) {
  const child = spawn(program, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { output += data; process.stdout.write(data) })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`${program} exited ${code}: ${output.slice(-2000)}`)
}
export async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  const exited = once(child, 'exit')
  child.kill('SIGTERM')
  const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
  try { await exited } finally { clearTimeout(timer) }
}
export async function withPreview(run, { root = ROOT, viewport = { width: 1440, height: 900 } } = {}) {
  const probe = createServer()
  probe.listen(0, HOST)
  await once(probe, 'listening')
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  const base = `http://${HOST}:${port}`
  const child = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let serverOutput = ''
  child.stdout.on('data', d => { serverOutput += d }); child.stderr.on('data', d => { serverOutput += d })
  let browser
  try {
    let ready = false
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(`preview exited: ${serverOutput}`)
      try { ready = (await fetch(base)).ok } catch { /* server is starting */ }
      if (ready) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!ready) throw new Error(`preview readiness timeout ${base}: ${serverOutput}`)
    console.log(`preview host/probe/browser ${base}; pid ${child.pid}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    page.setDefaultTimeout(5000)
    return await run(page, base)
  } finally {
    try { if (browser) await browser.close() } finally { await stopProcess(child); console.log(`preview cleaned ${child.pid}`) }
  }
}
export async function settle(page, ms = SETTLE_MS) { await page.waitForTimeout(ms) }
export async function stepTo(page, index) {
  if (index > 0) await page.keyboard.press('ArrowRight')
  try { await page.locator(`[data-step-index="${index}"]`).waitFor() }
  catch { throw new Error(`transition step ${index}: public step index did not advance`) }
}

export async function browseRoot(page) {
  const hook = page.locator('[data-presentation-root]')
  await hook.waitFor()
  if (await hook.getAttribute('data-presentation-mode') === 'present') await page.keyboard.press('p')
  return hook
}
