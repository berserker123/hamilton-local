// Read-only HTTP checks. Restricted/unreachable pages are reported, never counted as passed.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),venues=require('./src/party-venues.json');
const qa=JSON.parse(fs.readFileSync(path.join(root,'out/qa-v18.json'),'utf8'));
const newLinks=new Set(venues.flatMap(v=>[v.url,...v.sources.map(s=>s.url)]));
const urls=[...new Set([...qa.links,...newLinks])].filter(u=>/^https?:/.test(u));
const results=[];let next=0;
async function worker(){while(next<urls.length){const url=urls[next++];let row={url,scope:newLinks.has(url)?'v18 source':'rendered link'};
 try{
  const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(18000),headers:{'User-Agent':'Mozilla/5.0 HamiltonLocalLinkReview/1.0'}});
  const html=await r.text();const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]?.replace(/\s+/g,' ').trim()||'';
  const soft404=r.ok&&/^(?:404|page not found|not found|error 404)\b/i.test(title);
  row={...row,status:r.status,final_url:r.url,title:title.slice(0,220),result:r.status===404||soft404?'not found':r.status===410?'gone':r.ok?'reachable':'restricted or HTTP error'};
 }catch(e){row={...row,status:null,result:'unverified',error:e.cause?.code||e.name||e.message};}
 results.push(row);
 }}
(async()=>{await Promise.all(Array.from({length:6},worker));results.sort((a,b)=>a.url.localeCompare(b.url));const report={checked_at:new Date().toISOString(),method:'GET with redirects; 18-second timeout; title-based soft-404 detection; inaccessible pages remain unverified',total:results.length,counts:results.reduce((a,r)=>(a[r.result]=(a[r.result]||0)+1,a),{}),results};fs.writeFileSync(path.join(root,'out/external-links-v18.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:results.filter(r=>r.result!=='reachable')},null,2));if(results.some(r=>['not found','gone'].includes(r.result)))process.exitCode=1;})();
