import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

export function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => code === 0
      ? resolveRun()
      : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

export function getAvailablePort(host) {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Could not allocate an IPv4 preview port.'))
        return
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port))
    })
  })
}

export function watchPreview(preview) {
  let failure
  const recordFailure = (error) => {
    failure = error instanceof Error ? error : new Error(String(error))
  }
  preview.once('error', recordFailure)
  preview.once('exit', (code, signal) => {
    recordFailure(new Error(`Preview exited before readiness (${code ?? signal ?? 'unknown'}).`))
  })
  return () => failure
}

export async function waitForPreview(url, getPreviewFailure, {
  overallTimeoutMs = 10_000,
  pollIntervalMs = 250,
  requestTimeoutMs = 1_000,
} = {}) {
  const deadline = Date.now() + overallTimeoutMs
  while (Date.now() < deadline) {
    const failure = getPreviewFailure()
    if (failure) throw failure
    const remainingMs = deadline - Date.now()
    try {
      const timeoutMs = Math.max(1, Math.min(requestTimeoutMs, remainingMs))
      if ((await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })).ok) return
    } catch {
      // The preview process is still starting.
    }
    const delayMs = Math.min(pollIntervalMs, deadline - Date.now())
    if (delayMs > 0) await delay(delayMs)
  }
  throw getPreviewFailure() ?? new Error(`Preview did not become ready at ${url}`)
}
