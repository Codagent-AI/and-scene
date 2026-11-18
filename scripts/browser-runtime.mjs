import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export const HOST = '127.0.0.1'
export const SETTLE_MS = 900
export function command(command, args, cwd = process.cwd()) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${command} exited ${code}`)))
  })
}
async function freePort() {
  const server = createServer()
  await new Promise((res, rej) => { server.once('error', rej); server.listen(0, HOST, res) })
  const port = server.address().port
  await new Promise(res => server.close(res))
  return port
}
export async function withBrowser(action, { cwd = process.cwd(), viewport = { width: 1440, height: 900 } } = {}) {
  const port = await freePort()
  const origin = `http://${HOST}:${port}`
  const server = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''; let launchError
  server.stdout.on('data', data => { output += data })
  server.stderr.on('data', data => { output += data })
  server.on('error', error => { launchError = error })
  let browser
  console.log(`PREVIEW ${origin} PID ${server.pid}`)
  try {
    const deadline = Date.now() + 15000
    while (true) {
      if (launchError) throw launchError
      if (server.exitCode !== null) throw new Error(`Preview exited: ${output}`)
      try {
        console.log(`PROBE ${origin}`)
        const response = await fetch(origin)
        if (response.ok) { console.log(`READINESS ${response.url}`); break }
      } catch { /* wait for preview readiness */ }
      if (Date.now() > deadline) throw new Error(`Preview readiness timed out at ${origin}: ${output}`)
      await new Promise(res => setTimeout(res, 50))
    }
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    page.on('request', request => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) console.log(`BROWSER ${request.url()}`)
    })
    return await action(page, origin)
  } finally {
    try { await browser?.close() } finally {
      if (server.exitCode === null && !launchError) {
        await new Promise(res => {
          server.once('exit', res)
          server.kill('SIGTERM')
          const timer = setTimeout(() => server.kill('SIGKILL'), 2000)
          timer.unref()
          server.once('exit', () => clearTimeout(timer))
        })
      }
      console.log(`CLEANUP preview ${server.pid}`)
    }
  }
}
export function options(args = process.argv.slice(2)) {
  const value = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined
  return { slug: value('--slug'), noBuild: args.includes('--no-build'), settle: Number(value('--settle') ?? SETTLE_MS), width: Number(value('--width') ?? 1440), height: Number(value('--height') ?? 900) }
}
