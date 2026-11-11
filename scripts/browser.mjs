import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { chromium } from 'playwright'
import { setTimeout as delay } from 'node:timers/promises'
import { resolve } from 'node:path'

export const HOST = '127.0.0.1'
export function run(command, args, cwd = process.cwd()) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? accept() : reject(new Error(`${command} ${args.join(' ')} failed (${code ?? signal})`)))
  })
}
async function freePort() {
  const server = createServer()
  server.listen(0, HOST)
  await once(server, 'listening')
  const port = server.address().port
  await new Promise(accept => server.close(accept))
  return port
}
export async function withBrowser(action, { cwd = process.cwd(), viewport = { width: 1440, height: 900 } } = {}) {
  const port = await freePort()
  const url = `http://${HOST}:${port}`
  const server = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  let serverError
  server.stdout.on('data', chunk => { output += chunk })
  server.stderr.on('data', chunk => { output += chunk })
  server.once('error', error => { serverError = error })
  let browser
  const cleanup = () => { server.kill('SIGTERM') }
  process.once('SIGTERM', cleanup)
  process.once('SIGINT', cleanup)
  try {
    let ready = false
    for (let attempt = 0; attempt < 150; attempt++) {
      if (serverError || server.exitCode !== null) throw new Error(`preview: ${serverError ?? output}`)
      try { ready = (await fetch(url)).ok } catch { /* Server is still starting. */ }
      if (ready) break
      await delay(100)
    }
    if (!ready) throw new Error(`preview: readiness timeout at ${url}: ${output}`)
    console.log(`preview ready ${url} pid=${server.pid}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    return await action(page, url)
  } finally {
    await browser?.close()
    const exited = once(server, 'exit')
    cleanup()
    if (server.exitCode === null) await Promise.race([exited, delay(2000).then(() => server.kill('SIGKILL'))])
    process.removeListener('SIGTERM', cleanup)
    process.removeListener('SIGINT', cleanup)
    console.log(`preview stopped pid=${server.pid}`)
  }
}
export function watchErrors(page) {
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  return () => { if (errors.length) throw new Error(errors.join(' | ')) }
}
export async function stepTo(page, index, checkErrors, settle = 800) {
  try {
    await page.waitForFunction(expected => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(expected), index, { timeout: 5000 })
    await page.waitForTimeout(settle)
    checkErrors()
  } catch (error) { throw new Error(`render: step ${index}: ${error.message}`) }
}
