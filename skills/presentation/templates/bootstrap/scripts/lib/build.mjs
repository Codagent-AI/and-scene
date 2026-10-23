import { spawn } from 'node:child_process'

/** Run `npm run build` in `root`, resolving with the exit code and combined output. */
export function runBuild(root) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', reject)
    child.on('close', (code) => resolve({ code, output }))
  })
}

export const tail = (output, lines = 30) => output.trim().split('\n').slice(-lines).join('\n')
