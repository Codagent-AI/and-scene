import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'

const READY_TIMEOUT_MS = 10000
const POLL_INTERVAL_MS = 100
const POLL_REQUEST_TIMEOUT_MS = 1000

export async function startPreview(host, port) {
  // --strictPort makes vite exit rather than pick another port, so a port that is
  // already served would otherwise answer the readiness poll and pass verification
  // against an unrelated application.
  await assertPortIsFree(host, port)

  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  const address = `http://${host}:${port}`
  let output = ''
  const record = (chunk) => { output += chunk.toString() }
  child.stdout.on('data', record)
  child.stderr.on('data', record)

  // A served request is the only proof of readiness that does not depend on the
  // wording, stream, or ANSI coloring of vite's startup banner.
  const cancelPolling = new AbortController()
  const crashed = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => reject(new Error(`preview exited before startup (code=${code}, signal=${signal}): ${output.trim()}`)))
  })
  crashed.catch(() => {})

  try {
    await Promise.race([crashed, pollUntilServing(address, () => output, cancelPolling.signal)])
    return child
  } catch (error) {
    await stopPreview(child)
    throw error
  } finally {
    cancelPolling.abort()
  }
}

function assertPortIsFree(host, port) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host, port })
    socket.once('connect', () => {
      socket.destroy()
      reject(new Error(`port ${port} on ${host} is already in use; stop the process holding it before starting the preview`))
    })
    socket.once('error', () => resolve())
  })
}

async function pollUntilServing(address, getOutput, signal) {
  const deadline = Date.now() + READY_TIMEOUT_MS
  for (;;) {
    // Each attempt is bounded so a connection that accepts but never responds
    // cannot outlive the readiness deadline.
    const attempt = AbortSignal.any([signal, AbortSignal.timeout(POLL_REQUEST_TIMEOUT_MS)])
    try {
      const response = await fetch(`${address}/`, { signal: attempt })
      await response.arrayBuffer()
      if (response.ok) return
    } catch {
      if (signal.aborted) throw new Error(`preview readiness polling for ${address} was cancelled`)
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
