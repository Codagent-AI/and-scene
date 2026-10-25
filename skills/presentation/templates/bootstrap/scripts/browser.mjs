import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const SETTLE_MS = 1200
export function command(command, args, cwd = process.cwd()) {
 return new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd, stdio: 'inherit' })
  child.on('error', reject)
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)))
 })
}
async function freePort() {
 const server = createServer()
 await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, HOST, resolve) })
 const port = server.address().port
 await new Promise(resolve => server.close(resolve))
 return port
}
export async function withPreview(run) {
 let browser, child
 const port = await freePort(), url = `http://${HOST}:${port}`
 try {
  child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  let output = '', exited = false
  child.stdout.on('data', d => { output += d }); child.stderr.on('data', d => { output += d })
  child.on('exit', () => { exited = true })
  let ready = false
  for (let i = 0; i < 100; i++) {
   if (exited) throw new Error(`preview startup failed: ${output}`)
   try { if ((await fetch(url)).ok) { ready = true; break } } catch { /* wait for binding */ }
   await new Promise(r => setTimeout(r, 100))
  }
  if (!ready) throw new Error(`preview readiness failed: ${url}`)
  console.log(`PREVIEW host=${HOST} readiness=${url} pid=${child.pid}`)
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  return await run(browser, url)
 } finally {
  try { if (browser) await browser.close() } finally {
  if (child && child.exitCode === null) {
   const closed = new Promise(resolve => child.once('exit', resolve))
   child.kill('SIGTERM')
   const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
   await closed; clearTimeout(timer)
  }
  if (child) console.log(`PREVIEW stopped pid=${child.pid}`)
  }
 }
}
export function monitorErrors(page) {
 const errors = []
 let step = 0
 page.on('console', message => { if (message.type() === 'error') errors.push(`step ${step}: ${message.text()}`) })
 page.on('pageerror', error => errors.push(`step ${step}: ${error.message}`))
 return { setStep(index) { step = index }, check() { if (errors.length) throw new Error(`render: ${errors.join('; ')}`) } }
}
export async function stepCount(page) {
 const root = page.locator('[data-presentation-root]')
 await root.waitFor({ timeout: 5000 })
 const count = Number(await root.getAttribute('data-step-count'))
 if (!Number.isInteger(count) || count < 1) throw new Error('sample: invalid step count')
 return count
}
export async function advance(page, index) {
 await page.keyboard.press('ArrowRight')
 try { await page.waitForFunction(i => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3000 }) }
 catch { throw new Error(`transition: step ${index} failed to advance`) }
}
export function validateReference(actual, expected) {
 if (!Array.isArray(actual) || actual.length !== expected.length) throw new Error('sample: incorrect step count')
 const ids = new Set()
 actual.forEach((s, i) => {
  if (!s || !s.id || ids.has(s.id)) throw new Error(`sample: malformed or duplicate metadata at step ${i}`)
  ids.add(s.id)
  for (const key of ['id', 'era', 'title', 'caption']) if (typeof s[key] !== 'string' || !s[key].trim() || s[key] !== expected[i][key]) throw new Error(`sample: wrong ${key} at step ${i}`)
 })
}
