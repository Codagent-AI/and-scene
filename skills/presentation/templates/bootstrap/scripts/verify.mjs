import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)))
})
let server
let browser
const stop = (child) => new Promise((resolve) => {
  if (!child || child.exitCode !== null) return resolve()
  child.once('close', resolve)
  child.kill('SIGTERM')
})
try {
  await run('npm', ['run', 'build'])
  server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
  const url = 'http://127.0.0.1:4173/'
  let ready = false
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('preview exited before becoming ready')
    try { ready = (await fetch(url)).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('preview did not become ready at 127.0.0.1:4173')
  const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const bundledChromium = existsSync('/ms-playwright') ? readdirSync('/ms-playwright').filter((name) => name.startsWith('chromium-')).map((name) => `/ms-playwright/${name}/chrome-linux64/chrome`).find(existsSync) : undefined
  browser = await chromium.launch({ headless: true, ...((systemChromium || bundledChromium) ? { executablePath: systemChromium || bundledChromium } : {}) })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`${url}starter`, { waitUntil: 'networkidle' })
  if (await page.locator('[data-presentation-root]').count() !== 1) throw new Error('registered starter route did not render')
  if (errors.length) throw new Error(`browser render errors: ${errors.join('; ')}`)
  console.log('PASS: build and landing render')
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await stop(server)
}
