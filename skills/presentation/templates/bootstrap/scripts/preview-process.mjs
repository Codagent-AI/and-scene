import { spawn } from 'node:child_process'

/** Start Vite on an OS-assigned port and resolve only from its own Local URL. */
export function startPreview(vite, cwd, spawnProcess = spawn) {
  const child = spawnProcess(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '0'], {
    cwd,
    stdio: ['ignore', 'pipe', 'inherit'],
  })

  let output = ''
  let settled = false
  let rejectReady
  const ready = new Promise((resolve, reject) => {
    rejectReady = reject
    const fail = (error) => {
      if (settled) return
      settled = true
      reject(error)
    }
    child.once('error', fail)
    child.once('exit', (code, signal) => fail(new Error(`preview exited with ${code === null ? signal : `code ${code}`} before reporting its URL`)))
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk)
      output += chunk.replace(/\u001b\[[0-9;]*m/g, '')
      const match = output.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+\/?)/)
      if (match && !settled) {
        settled = true
        resolve({ child, url: match[1].replace(/\/$/, '') })
      }
    })
  })

  const timeout = setTimeout(() => rejectReady(new Error('preview did not report its local URL within 30 seconds')), 30000)
  timeout.unref?.()
  return { child, ready: ready.finally(() => clearTimeout(timeout)) }
}
