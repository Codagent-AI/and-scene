import { cp, mkdir, rm, symlink, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
export const root=process.cwd()
export async function disposable(name) {
 const dir=path.join(root,'.test-work',`${name}-${process.pid}`)
 await rm(dir,{recursive:true,force:true});await mkdir(dir,{recursive:true})
 for(const file of ['src','scripts','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','eslint.config.js','package.json','package-lock.json'])await cp(path.join(root,file),path.join(dir,file),{recursive:true})
 await symlink(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir')
 return dir
}
export function run(cmd,args,cwd,timeout=180000) {
 return new Promise((resolve,reject)=>{
  const child=spawn(cmd,args,{cwd,env:process.env,stdio:['ignore','pipe','pipe']});let output=''
  child.stdout.on('data',d=>{output+=d});child.stderr.on('data',d=>{output+=d})
  const timer=setTimeout(()=>{child.kill('SIGTERM');reject(new Error(`timeout: ${cmd} ${args.join(' ')}\n${output}`))},timeout)
  child.on('error',reject);child.on('exit',code=>{clearTimeout(timer);resolve({code,output})})
 })
}
export async function edit(dir,file,fn){const p=path.join(dir,file);await writeFile(p,fn(await readFile(p,'utf8')))}
export async function remove(dir){await rm(dir,{recursive:true,force:true})}
export function assertStopped(assert,output) {
 for(const kind of ['PREVIEW','BROWSER']) {
  const pids=[...output.matchAll(new RegExp(`${kind} started pid=(\\d+)`,'g'))].map(m=>Number(m[1]))
  for(const pid of pids){assert.match(output,new RegExp(`${kind} stopped pid=${pid}`));assert.throws(()=>process.kill(pid,0))}
 }
}
