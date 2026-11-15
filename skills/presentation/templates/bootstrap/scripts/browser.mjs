import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { setTimeout as delay } from 'node:timers/promises'
export const ROOT = fileURLToPath(new URL('../', import.meta.url))
export const HOST = '127.0.0.1'
export const SETTLE_MS = 1000
export async function command(file, args, cwd = process.cwd()) {
  await new Promise((ok, fail) => {
    const child = spawn(file, args, { cwd, stdio: 'inherit' })
    child.once('error', fail)
    child.once('exit', code => code === 0 ? ok() : fail(new Error(`${file} ${args.join(' ')} exited ${code}`)))
  })
}
async function freePort() {
  const server = createServer()
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, HOST, ok) })
  const { port } = server.address()
  await new Promise(ok => server.close(ok))
  return port
}
export async function withPreview(cwd, action) {
  const port = await freePort()
  const url = `http://${HOST}:${port}`
  const server = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  server.stdout.on('data', b => { output += b })
  server.stderr.on('data', b => { output += b })
  let browser, browserServer
  console.log(`preview resource ${JSON.stringify({ pid: server.pid, port })}`)
  const stop = () => server.kill('SIGTERM')
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  try {
    let ready = false
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error(`preview exited: ${output}`)
      try { ready = (await fetch(`${url}/index.html`, { headers: { Accept: 'text/html' } })).ok } catch { /* wait for server */ }
      if (ready) break
      await delay(50)
    }
    if (!ready) throw new Error(`preview readiness timeout: ${output}`)
    console.log(`preview ${url}`)
    browserServer = await chromium.launchServer({ headless: true })
    browser = await chromium.connect(browserServer.wsEndpoint())
    return await action(browser, url)
  } finally {
    try {
      if (browserServer) {
        const processIds = [browserServer.process().pid]
        if (browser?.isConnected()) {
          const session = await browser.newBrowserCDPSession()
          try {
            const { processInfo } = await session.send('SystemInfo.getProcessInfo')
            processIds.push(...processInfo.map(info => info.id))
          } finally { await session.detach() }
        }
        console.log(`browser resources ${JSON.stringify([...new Set(processIds)])}`)
      }
    } finally {
      try { await browser?.close() }
      finally {
        try { await browserServer?.close() }
        finally {
          if (server.exitCode === null && server.signalCode === null) {
            const exited = new Promise(ok => server.once('exit', ok))
            stop()
            await exited
          }
          process.removeListener('SIGINT', stop)
          process.removeListener('SIGTERM', stop)
          console.log(`preview stopped ${port}`)
        }
      }
    }
  }
}
export async function traverse(page, url, { settleMs = SETTLE_MS, onStep = async () => {}, expectedCount } = {}) {
  let index = 0
  let observedStep = 0
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(`step ${observedStep}: console: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`step ${observedStep}: page: ${error.message}`))
  await page.goto(url)
  const root = page.locator('[data-presentation]')
  try { await root.waitFor({ timeout: 5000 }) }
  catch (error) { throw new Error(`step 0: ${errors.length ? errors.join('\n') : `missing presentation route: ${url}: ${error.message}`}`, { cause: error }) }
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1 || (expectedCount && count !== expectedCount)) throw new Error(`sample: invalid step count ${count}`)
  for (index = 0; index < count; index++) {
    try {
      await page.waitForFunction(i => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3000 })
      await page.waitForTimeout(settleMs)
      if (errors.length) throw new Error(errors.join('\n'))
      await onStep(index, root)
      console.log(`step ${index}: rendered`)
      if (index < count - 1) { observedStep = index + 1; await page.keyboard.press('ArrowRight') }
    } catch (error) { throw new Error(`step ${index}: ${errors.length ? errors.join('\n') : error.message}`, { cause: error }) }
  }
  if (errors.length) throw new Error(errors.join('\n'))
}
