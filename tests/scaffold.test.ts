// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
const fs = vi.hoisted(() => ({existsSync:vi.fn(), readFileSync:vi.fn(), readdirSync:vi.fn(), mkdirSync:vi.fn(), copyFileSync:vi.fn()}))
vi.mock('node:fs',()=>fs)
// The copy tool is executable infrastructure, not a prompt-content test.
import { resolveTarget, scaffold, templateRoot } from '../skills/presentation/tools/scaffold.mjs'
beforeEach(()=>{vi.resetAllMocks();fs.existsSync.mockReturnValue(false);fs.readdirSync.mockReturnValue([])})
describe('scaffold target and preservation',()=>{
 it('uses root for standalone and existing apps, child for every monorepo signal',()=>{
  expect(resolveTarget('/project')).toBe('/project')
  for(const marker of ['pnpm-workspace.yaml','packages','apps']){
   fs.existsSync.mockImplementation((p:string)=>p===`/project/${marker}`)
   expect(resolveTarget('/project')).toBe('/project/presentations')
   expect(resolveTarget('/project',true)).toBe('/project')
  }
  fs.existsSync.mockImplementation((p:string)=>p==='/project/package.json');fs.readFileSync.mockReturnValue('{"workspaces":["apps/*"]}')
  expect(resolveTarget('/project')).toBe('/project/presentations')
 })
 it('resolves templates beside the skill independent of working directory',()=>{
  expect(templateRoot.endsWith('/skills/presentation/templates/bootstrap')).toBe(true)
  expect(scaffold('/project')).toEqual({target:'/project',files:[]})
  expect(fs.copyFileSync).not.toHaveBeenCalled()
 })
 it('refuses unconfirmed nonempty writes and preflights every collision',()=>{
  fs.existsSync.mockImplementation((p:string)=>p==='/project');fs.readdirSync.mockImplementation((p:string)=>p==='/project'?['existing']:[])
  expect(()=>scaffold('/project',{write:true})).toThrow('confirmation')
  fs.readdirSync.mockImplementation((p:string)=>p===templateRoot?[{name:'package.json',isDirectory:()=>false}]:[])
  fs.existsSync.mockImplementation((p:string)=>p==='/project/package.json')
  expect(()=>scaffold('/project',{write:true,confirmed:true,existingApp:true})).toThrow('Preserve existing file')
  expect(fs.copyFileSync).not.toHaveBeenCalled()
 })
 it('copies only requested missing anchors and rejects invalid selections',()=>{
  fs.readdirSync.mockImplementation((p:string)=>p===templateRoot?[{name:'package.json',isDirectory:()=>false}]:[])
  expect(scaffold('/project',{write:true,anchors:['kit']})).toEqual({target:'/project',files:[]})
  expect(fs.copyFileSync).not.toHaveBeenCalled()
  scaffold('/project',{write:true,anchors:['build']});expect(fs.copyFileSync).toHaveBeenCalledTimes(1)
  expect(()=>scaffold('/project',{anchors:['unknown']})).toThrow('Unknown scaffold anchor')
 })
})
