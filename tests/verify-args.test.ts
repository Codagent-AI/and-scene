// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { afterEach, expect, it, vi } from 'vitest'
import { parseVerifyArgs } from '../scripts/verify.mjs'
import { command, withBrowser } from '../scripts/browser.mjs'
vi.mock('../scripts/browser.mjs',()=>({command:vi.fn(),walkSteps:vi.fn(),withBrowser:vi.fn()}))
const savedArgv=process.argv, savedExitCode=process.exitCode
afterEach(()=>{process.argv=savedArgv;process.exitCode=savedExitCode;vi.restoreAllMocks()})
const invalid=[['--route'],['--route','--first'],['--route','../bad'],['--route','/absolute'],['--route','bad slug'],['--route','']]
it.each(invalid.map(args=>({args,label:JSON.stringify(args)})))('R2 rejects invalid route arguments $label',({args})=>{
  expect(()=>parseVerifyArgs(args)).toThrow('--route requires a slug')
})
it.each([['--route'],['--route','--first']].map(args=>({args,label:JSON.stringify(args)})))('R2 CLI $label exits 2 before build or browser work',async({args})=>{
  const error=vi.spyOn(console,'error').mockImplementation(()=>{})
  vi.mocked(command).mockClear();vi.mocked(withBrowser).mockClear()
  process.argv=[process.execPath,fileURLToPath(new URL('../scripts/verify.mjs',import.meta.url)),...args]
  vi.resetModules()
  await import('../scripts/verify.mjs')
  expect(process.exitCode).toBe(2)
  expect(error).toHaveBeenCalledWith('--route requires a slug matching [a-z0-9-]+')
  expect(command).not.toHaveBeenCalled();expect(withBrowser).not.toHaveBeenCalled()
})
it('R2 default route is available only when route flag is absent',()=>{
  expect(parseVerifyArgs([])).toEqual({route:undefined,first:false,build:true})
  expect(parseVerifyArgs(['--route','my-presentation','--first','--skip-build'])).toEqual({route:'my-presentation',first:true,build:false})
})
