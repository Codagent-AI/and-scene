import { spawn } from 'node:child_process'

// Vite colorizes its startup banner, so the readiness probe must compare plain text:
// the port is wrapped in SGR escapes and a raw substring match never sees "127.0.0.1:4173".
const ANSI = /[\u001B\u009B][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PR-TZcf-ntqry=><]/g
export function stripAnsi(value) { return value.replace(ANSI, '') }

export async function startPreview(host, port) {
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  const address = `http://${host}:${port}`
  let output = ''
  let settled = false
  let timer
  const ready = new Promise((resolve, reject) => {
    const fail = (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(error)
    }
    const onOutput = (chunk) => {
      output += stripAnsi(chunk.toString())
      if (!settled && output.includes(address)) {
        settled = true
        clearTimeout(timer)
        resolve()
      }
    }
    child.stdout.on('data', onOutput)
    child.stderr.on('data', onOutput)
    child.once('error', fail)
    child.once('exit', (code, signal) => fail(new Error(`preview exited before startup (code=${code}, signal=${signal}): ${output.trim()}`)))
    timer = setTimeout(() => fail(new Error(`preview startup timed out: ${output.trim()}`)), 10000)
  })
  try {
    await ready
    const response = await fetch(`${address}/`)
    if (!response.ok) throw new Error(`preview readiness returned HTTP ${response.status}`)
    return child
  } catch (error) {
    await stopPreview(child)
    throw error
  }
}

export async function stopPreview(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  await new Promise((resolve) => {
    let finished = false
    const finish = () => { if (!finished) { finished = true; clearTimeout(timer); resolve() } }
    const timer = setTimeout(() => { child.kill('SIGKILL'); finish() }, 1500)
    child.once('exit', finish)
    child.kill('SIGTERM')
  })
}
