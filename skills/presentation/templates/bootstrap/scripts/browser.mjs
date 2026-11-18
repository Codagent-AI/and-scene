import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const SETTLE_MS = 900
export function run(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}
export async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, HOST, resolve) })
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}
export async function withPreview(cwd, visit) {
  const port = await freePort()
  const base = `http://${HOST}:${port}`
  const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  preview.stdout.on('data', s => { output += s })
  preview.stderr.on('data', s => { output += s })
  let spawnError
  preview.on('error', e => { spawnError = e })
  let browser
  try {
    for (let n = 0; ; n++) {
      if (spawnError) throw spawnError
      if (preview.exitCode !== null || n > 150) throw new Error(`preview not ready: ${output}`)
      try { if ((await fetch(base)).ok) break } catch { /* readiness retry */ }
      await delay(100)
    }
    console.log(`preview ${base} pid=${preview.pid}`)
    browser = await chromium.launch({ headless: true })
    await visit(browser, base)
  } finally {
    try { if (browser) await browser.close() } finally {
    if (preview.pid && preview.exitCode === null) {
      const exited = new Promise(resolve => preview.once('exit', resolve))
      preview.kill('SIGTERM')
      const timer = setTimeout(() => preview.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(timer)
    }
    console.log(`preview cleaned pid=${preview.pid}`)
    }
  }
}
export function collectErrors(page, getStep) {
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`step ${getStep()}: console: ${msg.text()}`) })
  page.on('pageerror', error => errors.push(`step ${getStep()}: page: ${error.message}`))
  return () => { if (errors.length) throw new Error(errors.join('\n')) }
}
export async function openPresentation(page, base, slug) {
  await page.goto(`${base}/${slug}`)
  await page.locator('[data-presentation]').waitFor({ timeout: 10000 })
  const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('invalid step count')
  return count
}
export async function advance(page, index) {
  await page.keyboard.press('ArrowRight')
  await page.waitForFunction(n => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === n, index, { timeout: 3000 }).catch(() => { throw new Error(`step ${index}: transition failed`) })
}
