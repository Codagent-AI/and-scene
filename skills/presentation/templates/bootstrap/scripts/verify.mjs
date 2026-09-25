import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vite = path.join(project, 'node_modules/vite/bin/vite.js')
const run = (command, args, cwd) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd, stdio: 'inherit', shell: command === 'npm' && process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
})
function stop(child, exited) {
  if (child.exitCode !== null || child.signalCode !== null) return exited
  child.kill('SIGTERM')
  return Promise.race([exited.then(() => true), delay(3000).then(() => false)]).then(async (stopped) => {
    if (!stopped && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await exited
  })
}
function launchPreview() {
  const child = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '0', '--strictPort'], { cwd: project, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  let stderr = ''
  const exited = new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })))
  const ready = new Promise((resolve, reject) => {
    let settled = false
    child.stdout.setEncoding('utf8').on('data', (chunk) => {
      output += chunk
      const match = output.match(/Local:\s+(https?:\/\/127\.0\.0\.1:\d+)/)
      if (match && !settled) { settled = true; resolve(match[1]) }
    })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk })
    child.once('error', (error) => { if (!settled) { settled = true; reject(error) } })
    child.once('exit', (code, signal) => {
      if (!settled) { settled = true; reject(new Error(`preview exited before listening (code ${code}, signal ${signal})${stderr ? `: ${stderr.trim()}` : ''}`)) }
    })
  })
  return { child, exited, ready }
}

let server
let browser
let serverExited
try {
  await run('npm', ['run', 'build'], project)
  const preview = launchPreview()
  server = preview.child
  serverExited = preview.exited
  const url = await preview.ready
  let ready = false
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error(`preview exited before readiness (code ${server.exitCode})`)
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`render check: spawned preview did not respond at ${url}`)
  browser = await chromium.launch({ headless: true })
  const landing = await browser.newPage()
  await landing.goto(url)
  const routes = await landing.locator('main li a').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter(Boolean))
  await landing.close()
  if (!routes.length) throw new Error('render check: landing page has no registered presentation routes')

  for (const route of routes) {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    try {
      await page.goto(new URL(route, url).href)
      try { await page.locator('[data-step-count]').waitFor({ timeout: 10000 }) } catch {
        throw new Error(`route ${route} did not mount a presentation${errors.length ? `: ${errors.join('; ')}` : ''}`)
      }
      const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error(`route ${route} reports invalid step count ${count}`)
      for (let index = 0; index < count; index++) {
        await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index)
        if (errors.length) throw new Error(`step ${index}: ${errors.join('; ')}`)
        if (index + 1 < count) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(800) }
      }
      console.log(`PASS: rendered ${count} step(s) at ${route}`)
    } catch (error) {
      throw new Error(`render check failed for ${route}: ${error.message}`)
    } finally {
      await page.close()
    }
  }
  console.log(`PASS: build and rendered ${routes.length} registered presentation(s) on 127.0.0.1`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && serverExited) await stop(server, serverExited)
}
