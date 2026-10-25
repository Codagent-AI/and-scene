import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export const HOST = '127.0.0.1'
export function build(cwd = process.cwd()) {
  const result = spawnSync('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
  if (result.status !== 0) throw new Error('build: whole-application build failed')
}
async function freePort() {
  const server = createServer()
  await new Promise((yes, no) => { server.once('error', no); server.listen(0, HOST, yes) })
  const port = server.address().port
  await new Promise((yes, no) => server.close(error => error ? no(error) : yes()))
  return port
}
export async function withPreview(run, { cwd = process.cwd(), viewport = { width: 1440, height: 900 } } = {}) {
  const port = await freePort()
  const baseURL = `http://${HOST}:${port}`
  const server = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let serverOutput = ''
  server.stdout.on('data', data => { serverOutput += data })
  server.stderr.on('data', data => { serverOutput += data })
  const exited = new Promise(resolveExit => { server.once('exit', resolveExit); server.once('error', resolveExit) })
  let browser
  try {
    const deadline = Date.now() + 15000
    while (true) {
      if (server.exitCode !== null) throw new Error(`preview: exited early: ${serverOutput}`)
      try { const response = await fetch(baseURL); if (response.ok) break } catch { /* readiness retry */ }
      if (Date.now() >= deadline) throw new Error(`preview: readiness timeout at ${baseURL}: ${serverOutput}`)
      await new Promise(done => setTimeout(done, 100))
    }
    console.log(`preview: host=${HOST} readiness=${baseURL} pid=${server.pid}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    return await run(page, baseURL)
  } finally {
    await browser?.close()
    if (server.exitCode === null) {
      server.kill('SIGTERM')
      await Promise.race([exited, new Promise(done => setTimeout(done, 2000))])
      if (server.exitCode === null) { server.kill('SIGKILL'); await exited }
    }
    server.stdout.destroy()
    server.stderr.destroy()
    console.log(`preview: cleaned pid=${server.pid}`)
  }
}
export function browserErrors(page) {
  let step = 0
  const errors = []
  const record = (kind, message) => errors.push(`browser: step ${step} ${kind}: ${message}`)
  page.on('console', message => { if (message.type() === 'error') record('console.error', message.text()) })
  page.on('pageerror', error => record('pageerror', error.message))
  return {
    setStep(value) { step = value },
    assertClean() { if (errors.length) throw new Error(errors.join('\n')) },
    errors,
  }
}
export async function visit(page, baseURL, slug, errors) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('sample: invalid presentation slug')
  console.log(`browser: url=${baseURL}/${slug}`)
  await page.goto(`${baseURL}/${slug}`)
  const host = page.locator('[data-presentation]')
  try { await host.waitFor({ timeout: 5000 }) } catch { errors.assertClean(); throw new Error(`sample: registered presentation not reachable: ${slug}`) }
  errors.assertClean()
  const count = Number(await host.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('sample: invalid data-step-count')
  return { host, count }
}
export async function advance(page, index, errors) {
  errors.setStep(index)
  await page.keyboard.press('ArrowRight')
  try { await page.waitForFunction(i => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(i), index, { timeout: 4000 }) }
  catch { errors.assertClean(); throw new Error(`transition: step ${index} did not advance data-step-index`) }
  errors.assertClean()
}
