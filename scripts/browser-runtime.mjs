import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

export async function build(cwd = process.cwd()) {
  await new Promise((done, fail) => {
    const child = spawn('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
    child.on('error', fail)
    child.on('exit', (code) => code === 0 ? done() : fail(new Error(`build: npm run build exited ${code}`)))
  })
}

async function freePort() {
  const server = createServer()
  await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done) })
  const port = server.address().port
  await new Promise((done) => server.close(done))
  return port
}

export async function withBrowser(cwd, callback, viewport = { width: 1440, height: 900 }) {
  const port = await freePort()
  const base = `http://127.0.0.1:${port}`
  const preview = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let previewOutput = ''
  let previewError
  preview.on('error', (error) => { previewError = error })
  preview.stdout.on('data', (chunk) => { previewOutput += chunk })
  preview.stderr.on('data', (chunk) => { previewOutput += chunk })
  let browser
  const stop = async () => {
    try { await browser?.close() }
    finally {
      if (preview.pid && preview.exitCode === null) {
        const exited = new Promise((done) => preview.once('exit', done))
        preview.kill('SIGTERM')
        await exited
      }
    }
  }
  const signal = () => { void stop().finally(() => process.exit(130)) }
  process.once('SIGINT', signal)
  process.once('SIGTERM', signal)
  try {
    console.log(`preview host/readiness: ${base} pid=${preview.pid}`)
    let ready = false
    for (let i = 0; i < 150; i++) {
      if (previewError) throw new Error(`preview: ${previewError.message}`, { cause: previewError })
      if (preview.exitCode !== null) throw new Error(`preview: exited before ready: ${previewOutput}`)
      try { ready = (await fetch(base)).ok } catch { /* wait for server */ }
      if (ready) break
      await sleep(100)
    }
    if (!ready) throw new Error(`preview: readiness timed out at ${base}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    return await callback(page, base)
  } finally {
    process.off('SIGINT', signal)
    process.off('SIGTERM', signal)
    await stop()
    console.log('preview stopped')
  }
}

export function collectErrors(page) {
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

export async function stepCount(page) {
  const root = page.locator('[data-step-count][data-step-index]').first()
  await root.waitFor({ timeout: 8000 })
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('render: invalid data-step-count')
  return count
}

export async function waitForStep(page, index) {
  try {
    await page.locator(`[data-step-index="${index}"]`).first().waitFor({ timeout: 3500 })
  } catch {
    throw new Error(`transition step ${index}: data-step-index did not advance`)
  }
}

export function parseOptions(args) {
  const options = { slug: undefined, width: 1440, height: 900, settle: 1000 }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (['--slug', '--width', '--height', '--settle'].includes(arg)) {
      const key = arg.slice(2)
      const value = args[++i]
      if (!value) throw new Error(`arguments: ${arg} requires a value`)
      options[key] = key === 'slug' ? value : Number(value)
    } else if (!arg.startsWith('-') && !options.slug) options.slug = arg
    else throw new Error(`arguments: unknown option ${arg}`)
  }
  if (options.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.slug)) throw new Error('arguments: invalid presentation slug')
  for (const key of ['width', 'height', 'settle']) if (!Number.isFinite(options[key]) || options[key] < (key === 'settle' ? 0 : 1)) throw new Error(`arguments: invalid ${key}`)
  return options
}
