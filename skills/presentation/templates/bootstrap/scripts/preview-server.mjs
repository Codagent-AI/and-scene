import { spawn } from 'node:child_process'

const STARTUP_TIMEOUT_MS = 30_000
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g

export async function startPreview(port) {
  const expectedUrl = `http://127.0.0.1:${port}/`
  const child = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1',
    '--port', String(port), '--strictPort',
  ], { stdio: ['ignore', 'pipe', 'pipe'] })

  let output = ''
  // CI/FORCE_COLOR make vite colorize its banner, splitting the URL with ANSI codes. Strip after
  // concatenating so a sequence split across stdout chunks is still removed.
  const append = (chunk) => { output = (output + chunk.toString()).replace(ANSI_PATTERN, '') }
  child.stderr.on('data', append)

  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return
    const exited = new Promise((resolve) => child.once('exit', resolve))
    child.kill('SIGTERM')
    let timeoutId
    const timedOut = await Promise.race([exited.then(() => false), new Promise((resolve) => { timeoutId = setTimeout(() => resolve(true), 3000) })])
    clearTimeout(timeoutId)
    if (timedOut) {
      child.kill('SIGKILL')
      await exited
    }
  }

  try {
    await new Promise((resolve, reject) => {
      let settled = false
      const settle = (callback, value) => { if (!settled) { settled = true; clearTimeout(timeoutId); callback(value) } }
      const fail = (error) => settle(reject, error)
      const timeoutId = setTimeout(() => fail(new Error(`Preview did not report ${expectedUrl} within ${STARTUP_TIMEOUT_MS}ms: ${output}`)), STARTUP_TIMEOUT_MS)
      child.once('error', fail)
      child.once('exit', (code, signal) => fail(new Error(`Preview exited before startup (code ${code}, signal ${signal}): ${output}`)))
      child.stdout.on('data', (chunk) => {
        append(chunk)
        if (output.includes(expectedUrl)) settle(resolve)
      })
    })
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Preview exited during startup: ${output}`)
    const response = await fetch(expectedUrl)
    if (!response.ok) throw new Error(`Preview at ${expectedUrl} returned HTTP ${response.status}`)
    return { child, stop }
  } catch (error) {
    await stop()
    throw error
  }
}
