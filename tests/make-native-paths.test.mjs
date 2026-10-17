import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {test} from 'node:test';

test('generation preserves native canonical paths through nested output and a second run',()=>{
 const root=mkdtempSync(join(tmpdir(),'mcp-native-'));
 const runtime=process.env.KUJO_BIN;assert.ok(runtime,'KUJO_BIN must select the tested runtime');
 try {
  const target=join(root,process.platform==='win32'?'repo with spaces':'repo with \\ literal');mkdirSync(target);
  writeFileSync(join(target,'README.md'),'# Native path fixture\n');
  writeFileSync(join(target,'package.json'),JSON.stringify({name:'native-path-fixture'}));
  const out=join(target,'nested','server');const artifacts=join(target,'nested','artifacts');
  for(let attempt=0;attempt<2;attempt++){
   execFileSync(runtime,['run',resolve('mcp.kujo'),'--interpreter','make',target,'--out',out,'--artifacts',artifacts,'--no-ai'],{cwd:resolve('.'),timeout:120000});
   for(const file of ['repo-profile.json','mcp.manifest.json','mcp-server.json','src/server.kujo','src/prompts/review_patch.md'])assert.ok(existsSync(join(out,file)),file);
   assert.ok(existsSync(join(artifacts,'validation-report.md')));
   const manifest=JSON.parse(readFileSync(join(out,'mcp.manifest.json'),'utf8'));
   for(const resource of manifest.resources)if(resource.path)assert.ok(existsSync(resource.path),resource.path);
   execFileSync(runtime,['run',join(out,'src','server.kujo'),'--interpreter','--self-check'],{timeout:30000});
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});
