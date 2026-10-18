import { spawnSync } from 'node:child_process'

export interface Run {
  status: number | null
  output: string
}

/** Runs a command and returns its exit status and combined output. */
export function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Run {
  const r = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    maxBuffer: 64 * 1024 * 1024,
    timeout: 220_000,
  })
  return { status: r.status, output: `${r.stdout}${r.stderr}` }
}
