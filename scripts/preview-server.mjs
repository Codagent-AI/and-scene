import { spawn } from 'node:child_process'

const READY_TIMEOUT_MS = 10000
const POLL_INTERVAL_MS = 100

export async function startPreview(host, port) {
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  const address = `http://${host}:${port}`
  let output = ''
  const record = (chunk) => { output += chunk.toString() }
  child.stdout.on('data', record)
  child.stderr.on('data', record)

  // A served request is the only proof of readiness that does not depend on the
  // wording, stream, or ANSI coloring of vite's startup banner.
  const crashed = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => reject(new Error(`preview exited before startup (code=${code}, signal=${signal}): ${output.trim()}`)))
  })
  crashed.catch(() => {})

  try {
    await Promise.race([crashed, pollUntilServing(address, () => output)])
    return child
  } catch (error) {
    await stopPreview(child)
    throw error
  }
}

async function pollUntilServing(address, getOutput) {
  const deadline = Date.now() + READY_TIMEOUT_MS
  for (;;) {
    try {
      const response = await fetch(`${address}/`)
      await response.arrayBuffer()
      if (response.ok) return
    } catch {
      // not listening yet
    }
    if (Date.now() >= deadline) throw new Error(`preview did not serve ${address} within ${READY_TIMEOUT_MS}ms: ${getOutput().trim()}`)
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
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
