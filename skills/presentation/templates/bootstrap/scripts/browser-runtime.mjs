import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { chromium } from 'playwright'
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export async function build(root = projectRoot) {
  console.log('PHASE build: npm run build')
  await new Promise((accept, reject) => {
    const process = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
    process.on('error', reject)
    process.on('exit', code => code === 0 ? accept() : reject(new Error(`build: npm run build exited ${code}`)))
  })
}
async function freePort() {
  const server = createServer()
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', accept) })
  const port = server.address().port
  await new Promise(accept => server.close(accept))
  return port
}
export async function withBrowser(run, { root = projectRoot, width = 1440, height = 900 } = {}) {
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let serverOutput = ''
  let launchError
  server.on('error', error => { launchError = error })
  server.stdout.on('data', chunk => { serverOutput += chunk })
  server.stderr.on('data', chunk => { serverOutput += chunk })
  console.log(`PREVIEW pid=${server.pid} host=127.0.0.1 probe=${url}`)
  let browser
  const terminate = () => { server.kill('SIGTERM'); void browser?.close() }
  process.once('SIGTERM', terminate)
  process.once('SIGINT', terminate)
  try {
    let ready = false
    for (let i = 0; i < 100; i++) {
      if (launchError || server.exitCode !== null) throw new Error(`preview: ${launchError ?? serverOutput}`)
      try { ready = (await fetch(url)).ok } catch { /* server not yet listening */ }
      if (ready) break
      await new Promise(accept => setTimeout(accept, 50))
    }
    if (!ready) throw new Error(`preview readiness timeout: ${serverOutput}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width, height } })
    return await run(page, url)
  } finally {
    await browser?.close()
    if (server.exitCode === null) {
      const stopped = new Promise(accept => server.once('exit', accept))
      server.kill('SIGTERM')
      const force = setTimeout(() => server.kill('SIGKILL'), 2000)
      await stopped
      clearTimeout(force)
    }
    process.off('SIGTERM', terminate)
    process.off('SIGINT', terminate)
    console.log(`CLEANUP preview pid=${server.pid}`)
  }
}
export function watchErrors(page) {
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(`console.error: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  return () => { if (errors.length) throw new Error(errors.join('\n')) }
}
export async function readStepCount(page) {
  await page.locator('[data-presentation][data-step-count]').waitFor({ timeout: 5000 })
  const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`invalid step count ${count}`)
  return count
}
export async function settleStep(page, index, settle = 850) {
  await page.waitForFunction(i => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3000 })
  await page.waitForTimeout(settle)
}
export function isMain(url) { return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(url) }
