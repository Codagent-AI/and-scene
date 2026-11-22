import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium } from 'playwright'
export async function command(program, args, { cwd = process.cwd(), timeout = 180000 } = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(program, args, { cwd, stdio: 'inherit' })
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`${program} timed out`)) }, timeout)
    child.once('error', reject)
    child.once('exit', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`${program} exited ${code}`)) })
  })
}
export async function freePort() {
  const server = createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}
export async function withPreview(task) {
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  server.stdout.on('data', chunk => { output += chunk })
  server.stderr.on('data', chunk => { output += chunk })
  let browser
  try {
    const deadline = Date.now() + 15000
    while (true) {
      if (server.exitCode !== null) throw new Error(`preview exited: ${output}`)
      try { if ((await fetch(url)).ok) break } catch { /* readiness retry */ }
      if (Date.now() > deadline) throw new Error(`preview readiness timed out: ${output}`)
      await new Promise(resolve => setTimeout(resolve, 80))
    }
    console.log(`preview ready ${url}`)
    browser = await chromium.launch({ headless: true })
    return await task(browser, url)
  } finally {
    if (browser) await browser.close()
    if (server.exitCode === null) {
      const exited = new Promise(resolve => server.once('exit', resolve))
      server.kill('SIGTERM')
      const kill = setTimeout(() => server.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(kill)
    }
    console.log('preview cleaned up')
  }
}
