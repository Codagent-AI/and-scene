import { cp, mkdtemp, mkdir, rm, symlink } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

export const repositoryRoot = process.cwd()

export async function createTestWorkspace(prefix: string, scriptPath: string) {
  const workspace = await mkdtemp(join(tmpdir(), prefix))
  await mkdir(join(workspace, 'scripts'), { recursive: true })
  await cp(scriptPath, join(workspace, 'scripts', basename(scriptPath)))
  await symlink(join(repositoryRoot, 'node_modules'), join(workspace, 'node_modules'), 'dir')
  return workspace
}

export function runNodeScript(
  workspace: string,
  scriptPath: string,
  args: string[] = [],
  timeoutMs = 10_000,
) {
  return new Promise<{ code: number | null; output: string }>((resolve) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { cwd: workspace })
    let output = ''
    let settled = false
    const finish = (code: number | null) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      resolve({ code, output })
    }
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      finish(null)
    }, timeoutMs)
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('error', () => finish(null))
    child.once('exit', (code) => finish(code))
  })
}

export async function removeTestWorkspaces(workspaces: string[]) {
  await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { recursive: true, force: true })))
}
