import { spawn } from 'node:child_process'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { stripVTControlCharacters } from 'node:util'

/** Runs a command with inherited stdio and rejects on a non-zero exit. */
export const run = (command, args, cwd) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd, stdio: 'inherit', shell: command === 'npm' && process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
})

async function waitUntilServing(child, url) {
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) throw new Error(`preview check failed: server exited with ${child.exitCode}`)
    try { if ((await fetch(url)).ok) return url } catch { /* not listening yet */ }
    await delay(250)
  }
  throw new Error(`preview check failed: spawned server did not respond at ${url}`)
}

/**
 * Starts `vite preview` on 127.0.0.1. The returned handle can be stopped at any
 * time; `ready` resolves with the base URL once the server answers requests.
 */
export function startPreview(project) {
  const vite = path.join(project, 'node_modules/vite/bin/vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '0', '--strictPort'], { cwd: project, stdio: ['ignore', 'pipe', 'pipe'] })
  let stdout = ''
  let stderr = ''
  const withStderr = (message) => `${message}${stderr ? `: ${stderr.trim()}` : ''}`
  const exited = new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })))
  const announced = new Promise((resolve, reject) => {
    let settled = false
    const settle = (callback, value) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      callback(value)
    }
    const timeout = setTimeout(() => settle(reject, new Error(withStderr('preview check failed: timed out waiting for Vite to announce its listening URL'))), 15000)
    child.stdout.setEncoding('utf8').on('data', (chunk) => {
      stdout = (stdout + chunk).slice(-8192)
      const match = stripVTControlCharacters(stdout).match(/Local:\s+(https?:\/\/127\.0\.0\.1:\d+)/)
      if (match) settle(resolve, match[1])
    })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk })
    child.once('error', (error) => settle(reject, new Error(`preview check failed: ${error.message}`)))
    child.once('exit', (code, signal) => settle(reject, new Error(withStderr(`preview check failed: server exited before listening (code ${code}, signal ${signal})`))))
  })
  return { child, exited, ready: announced.then((url) => waitUntilServing(child, url)) }
}

/** Stops a preview server, escalating to SIGKILL if SIGTERM is ignored. */
export async function stopPreview({ child, exited }) {
  if (child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGTERM')
  const stopped = await Promise.race([exited.then(() => true), delay(3000).then(() => false)])
  if (!stopped && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  await exited
}
