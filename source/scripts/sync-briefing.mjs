// Copies the hamilton-watch scraper output into src/data/briefing.json when present.
// Never fails the build: a missing or invalid source leaves briefing.json untouched.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const from=process.argv[2]||process.env.BRIEFING_SOURCE||'F:\\Bo\\hamilton-watch\\out\\latest.json';
const to=path.join(root,'src','data','briefing.json');
try{
  const data=JSON.parse(fs.readFileSync(from,'utf8'));
  if(!data||!Array.isArray(data.items)||!data.generated_at)throw new Error('unexpected schema');
  fs.writeFileSync(to,JSON.stringify(data,null,2)+'\n');
  console.log('sync-briefing: copied '+data.items.length+' items from '+from);
}catch(e){
  console.log('sync-briefing: skipped ('+(e.code==='ENOENT'?'source not found':e.message)+'); kept existing briefing.json');
}
