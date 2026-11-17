import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export async function command(cmd, args, cwd = process.cwd()) {
  const child = spawn(cmd, args, { cwd, stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`${cmd} ${args.join(' ')} exited ${code}`)
}

async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise((done) => server.close(done))
  return port
}

export async function withPreview(run, { cwd = process.cwd(), viewport = { width: 1440, height: 900 } } = {}) {
  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  const preview = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let serverOutput = ''
  preview.stdout.on('data', (chunk) => { serverOutput += chunk })
  preview.stderr.on('data', (chunk) => { serverOutput += chunk })
  let browser
  let browserServer
  const stop = () => { preview.kill('SIGTERM') }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
  try {
    for (let attempt = 0; ; attempt++) {
      if (preview.exitCode !== null || attempt >= 100) throw new Error(`preview readiness failed: ${serverOutput}`)
      try { if ((await fetch(origin)).ok) break } catch { /* preview is starting */ }
      await new Promise((done) => setTimeout(done, 100))
    }
    console.log(`preview ready ${origin} pid=${preview.pid}`)
    browserServer = await chromium.launchServer({ headless: true })
    console.log(`browser ready pid=${browserServer.process().pid}`)
    browser = await chromium.connect(browserServer.wsEndpoint())
    const page = await browser.newPage({ viewport })
    return await run(page, origin)
  } finally {
    process.removeListener('SIGTERM', stop)
    process.removeListener('SIGINT', stop)
    try { await browser?.close() } finally {
      try {
        await browserServer?.close()
        if (browserServer) console.log(`browser stopped pid=${browserServer.process().pid}`)
      } finally {
        if (preview.exitCode === null) {
          const exited = once(preview, 'exit')
          preview.kill('SIGTERM')
          await exited
        }
        console.log(`preview stopped pid=${preview.pid}`)
      }
    }
  }
}
