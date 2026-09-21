import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'

const READY_TIMEOUT_MS = 10000
const POLL_INTERVAL_MS = 100
const POLL_REQUEST_TIMEOUT_MS = 1000
// --strictPort makes a vite that loses the port exit instead of sharing it, so a
// child still alive across consecutive successful probes is proof that the server
// answering us is the one we spawned.
const REQUIRED_CONFIRMATIONS = 2

export async function startPreview(host, port) {
  // Fail fast and clearly when something already holds the port. This does not by
  // itself establish ownership (two starts can race), which is why readiness below
  // also requires our own child to stay alive.
  await assertPortIsFree(host, port)

  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  const address = `http://${host}:${port}`
  let output = ''
  const record = (chunk) => { output += chunk.toString() }
  child.stdout.on('data', record)
  child.stderr.on('data', record)

  // A served request plus a living child is the proof of readiness. Matching vite's
  // startup banner would be neither: its wording, stream, and ANSI coloring are all
  // incidental, and parsing it is what previously broke `npm run verify` outright.
  const cancelPolling = new AbortController()
  const crashed = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => reject(new Error(`preview exited before startup (code=${code}, signal=${signal}): ${output.trim()}`)))
  })
  crashed.catch(() => {})

  try {
    const isAlive = () => child.exitCode === null && child.signalCode === null
    await Promise.race([crashed, pollUntilServing(address, isAlive, () => output, cancelPolling.signal)])
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

async function pollUntilServing(address, isAlive, getOutput, signal) {
  const deadline = Date.now() + READY_TIMEOUT_MS
  let confirmations = 0
  for (;;) {
    // Each attempt is bounded so a connection that accepts but never responds
    // cannot outlive the readiness deadline.
    const attempt = AbortSignal.any([signal, AbortSignal.timeout(POLL_REQUEST_TIMEOUT_MS)])
    let served = false
    try {
      const response = await fetch(`${address}/`, { signal: attempt })
      await response.arrayBuffer()
      served = response.ok
    } catch {
      if (signal.aborted) throw new Error(`preview readiness polling for ${address} was cancelled`)
    }
    if (served) {
      if (!isAlive()) throw new Error(`preview exited while ${address} was answered by another process; the port is not ours`)
      confirmations += 1
      if (confirmations >= REQUIRED_CONFIRMATIONS) return
    } else {
      confirmations = 0
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
