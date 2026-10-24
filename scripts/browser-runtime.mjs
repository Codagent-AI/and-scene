import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const DEFAULT_SETTLE_MS = 850
export const delay = ms => new Promise(done => setTimeout(done, ms))
export function run(command, args, cwd) {
  return new Promise((done, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? done() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}
async function freePort() {
  const probe = createServer()
  await new Promise((done, reject) => { probe.once('error', reject); probe.listen(0, HOST, done) })
  const port = probe.address().port
  await new Promise(done => probe.close(done))
  return port
}
export async function withPreview(cwd, action) {
  const port = await freePort()
  const url = `http://${HOST}:${port}`
  const preview = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  preview.stdout.on('data', data => { output += data })
  preview.stderr.on('data', data => { output += data })
  let browser
  let browserServer
  let spawnError
  preview.on('error', error => { spawnError = error })
  try {
    console.log(`PREVIEW ${url}`)
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError
      if (preview.exitCode !== null) throw new Error(`Preview exited: ${output}`)
      try { const response = await fetch(url); if (response.ok) { ready = true; break } } catch { /* wait for bind */ }
      await delay(100)
    }
    if (!ready) throw new Error(`Preview readiness timeout at ${url}: ${output}`)
    browserServer = await chromium.launchServer({ headless: true, host: HOST })
    console.log(`BROWSER ${browserServer.process().pid}`)
    browser = await chromium.connect(browserServer.wsEndpoint())
    return await action(browser, url)
  } finally {
    try {
      if (browser) await browser.close()
    } finally {
      try {
        if (browserServer) {
          await browserServer.close()
          console.log(`CLEANUP browser ${browserServer.process().pid}`)
        }
      } finally {
        if (preview.exitCode === null) {
          const exited = new Promise(done => preview.once('exit', done))
          preview.kill('SIGTERM')
          const killTimer = setTimeout(() => preview.kill('SIGKILL'), 2000)
          await exited
          clearTimeout(killTimer)
        }
        console.log(`CLEANUP preview ${port}`)
      }
    }
  }
}
export function watchErrors(page) {
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  return errors
}
export async function readStepCount(page) {
  await page.locator('[data-presentation]').waitFor({ timeout: 10000 })
  const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count <= 0) throw new Error(`Invalid step count: ${count}`)
  return count
}
export async function visitSteps(page, count, action, { settleMs = DEFAULT_SETTLE_MS, transitionTimeout = 4000 } = {}) {
  for (let index = 0; index < count; index++) {
    try {
      if (index) await page.keyboard.press('ArrowRight')
      await page.waitForFunction(i => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(i), index, { timeout: transitionTimeout })
      await page.waitForTimeout(settleMs)
      await action(index)
    } catch (error) { throw new Error(`step ${index}: ${error.message}`, { cause: error }) }
  }
}
export function parseOptions(args) {
  const options = { slug: 'how-to-make-a-presentation', build: true, settleMs: DEFAULT_SETTLE_MS, width: 1440, height: 900 }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--skip-build') options.build = false
    else if (arg === '--slug') options.slug = args[++i]
    else if (arg === '--settle-ms') options.settleMs = Number(args[++i])
    else if (arg === '--width') options.width = Number(args[++i])
    else if (arg === '--height') options.height = Number(args[++i])
    else if (arg === '--out') options.out = args[++i]
    else if (!arg.startsWith('-')) options.slug = arg
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.slug)) throw new Error('Invalid presentation slug')
  for (const key of ['settleMs', 'width', 'height']) if (!Number.isFinite(options[key]) || options[key] < (key === 'settleMs' ? 0 : 1)) throw new Error(`Invalid ${key}`)
  return options
}
