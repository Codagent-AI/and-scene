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

export async function waitForPreview(url, getPreviewFailure) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const failure = getPreviewFailure()
    if (failure) throw failure
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // The preview process is still starting.
    }
    await delay(250)
  }
  throw getPreviewFailure() ?? new Error(`Preview did not become ready at ${url}`)
}
