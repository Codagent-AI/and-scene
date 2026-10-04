import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
const host = '127.0.0.1', port = 4178, base = `http://${host}:${port}`
const run = (cmd, args) => new Promise((resolve, reject) => { const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' }); child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} failed (${code})`))) })
let server, browser
try {
  await run('npm', ['run', 'build'])
  server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  let ready = false
  for (let i = 0; i < 80; i++) { try { if ((await fetch(base)).ok) { ready = true; break } } catch {} await delay(250); if (server.exitCode !== null) throw Error('vite preview exited before becoming ready') }
  if (!ready) throw Error('preview did not become ready')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage(), errors = []
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`${base}/example`, { waitUntil: 'networkidle' })
  if (!(await page.locator('[data-presentation]').count())) throw Error('registered example route did not render a presentation')
  if (errors.length) throw Error(`browser render failed: ${errors.join('; ')}`)
  console.log('PASS: build and registered example route render cleanly')
} catch (e) { console.error(`FAIL: ${e.message}`); process.exitCode = 1 } finally {
  await browser?.close()
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)) }
}
