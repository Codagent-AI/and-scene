import { execFile, spawn } from 'node:child_process'

export interface RunResult {
  code: number | null
  stdout: string
  stderr: string
}

export function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env } })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

/** PIDs of vite preview servers started from inside `dir`. */
export function previewProcesses(dir: string): Promise<string[]> {
  return new Promise((resolve) => {
    execFile('pgrep', ['-f', `${dir}/node_modules/vite/bin/vite.js`], (_error, stdout) => resolve(stdout.split('\n').filter(Boolean)))
  })
}
