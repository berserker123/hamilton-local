const {test}=require('node:test'),assert=require('node:assert/strict'),esbuild=require('esbuild');
function load(){const r=esbuild.buildSync({entryPoints:['src/feedback-model.ts'],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent'});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);return m.exports;}
const draft={type:'correction',message:'Please update these hours.',name:' Local ',contact:'hi@example.nz',botcheck:''};
const context={url:'http://127.0.0.1:4183/#/living?tab=grocers',section:'NewSave · 本地生活'};
test('feedback validates trimmed minimum, maximum, type, optional email and WeChat',()=>{
 const {validateFeedback:v}=load();assert.deepEqual(v(draft),{});
 for(const message of ['','    ','1234','   12  ','x'.repeat(1001)])assert.ok(v({...draft,message}).message);
 for(const message of ['12345','x'.repeat(1000)])assert.deepEqual(v({...draft,message}),{});
 assert.ok(v({...draft,type:'unknown'}).type);assert.ok(v({...draft,contact:'broken@'}).contact);
 for(const contact of ['','wechat_local-01','微信：本地生活','a+b@local.nz'])assert.deepEqual(v({...draft,contact}),{});
 assert.ok(v({...draft,name:'n'.repeat(81)}).name);assert.ok(v({...draft,contact:'c'.repeat(121)}).contact);
});
test('payload includes type, exact subject, context and safe replyto only for email',()=>{
 const {feedbackPayload:p}=load();const data=p(draft,context,'zh','test-key');
 assert.equal(data.subject,'Hamilton Local 反馈：信息纠错');assert.equal(data.access_key,'test-key');assert.equal(data.name,'Local');assert.equal(data.page_url,context.url);assert.equal(data.section,context.section);assert.equal(data.replyto,draft.contact);assert.equal(data.botcheck,false);
 assert.equal(p({...draft,contact:'wechat123'},context,'en','key').replyto,undefined);assert.equal(p({...draft,type:'recommendation'},context,'en','key').type,'New recommendation (shop, event or place)');
});
test('PENDING opens a correctly escaped email without submitting and does not claim delivery',async()=>{
 const {deliverFeedback}=load();let mail;const result=await deliverFeedback({...draft,message:'A & B\n中文信息 #1'},context,'zh',{key:'PENDING',fetcher:()=>{throw Error('must not fetch')},openMail:url=>{mail=url}});
 assert.equal(result,'email');assert.ok(mail.startsWith('mailto:hello@hamiltonlocal.nz?'));const u=new URL(mail);assert.equal(u.searchParams.get('subject'),'Hamilton Local 反馈：信息纠错');assert.ok(u.searchParams.get('body').includes('A & B\n中文信息 #1'));assert.ok(u.searchParams.get('body').includes(context.url));assert.ok(u.searchParams.get('body').includes(context.section));
});
test('honeypot prevents network and email even with a valid key',async()=>{
 const {deliverFeedback}=load();assert.equal(await deliverFeedback({...draft,botcheck:'spam'},context,'zh',{key:'key',fetcher:()=>{throw Error('must not fetch')},openMail:()=>{throw Error('must not open')}}),'blocked');
});
test('Web3Forms uses JSON POST and requires HTTP and API success',async()=>{
 const {deliverFeedback}=load();let request;const options={key:'key',fetcher:async(url,init)=>{request={url,init};return {ok:true,json:async()=>({success:true})}}};
 assert.equal(await deliverFeedback(draft,context,'en',options),'sent');assert.equal(request.url,'https://api.web3forms.com/submit');assert.equal(request.init.method,'POST');assert.equal(request.init.headers['Content-Type'],'application/json');assert.equal(JSON.parse(request.init.body).access_key,'key');
 for(const response of [{ok:false,json:async()=>({success:true})},{ok:true,json:async()=>({success:false})},{ok:true,json:async()=>{throw Error('invalid JSON')}}])await assert.rejects(deliverFeedback(draft,context,'en',{key:'key',fetcher:async()=>response}));
 await assert.rejects(deliverFeedback(draft,context,'en',{key:'key',fetcher:async()=>{throw Error('offline')}}));
 await assert.rejects(deliverFeedback({...draft,message:'bad'},context,'en',options));
});
