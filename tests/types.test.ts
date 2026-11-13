// @vitest-environment node
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { expect,it } from 'vitest'
it('I-14 typed payloads cross Presentation without casts and reject incompatible or missing contracts',async()=>{const result=await promisify(execFile)(process.execPath,['node_modules/typescript/bin/tsc','-p','tests/tsconfig.json'],{timeout:180000});expect(result.stderr).toBe('')})
