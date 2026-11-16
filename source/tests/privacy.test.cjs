const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('privacy has a real canonical route, bilingual metadata and one sitemap entry',async()=>{
  const {PAGES,SECTION_ORDER,href,readRoute,normalizeLocation,legacyHashPath,renderDocument,renderSitemap}=await import('../src/site-routes.mjs');
  assert.deepEqual(SECTION_ORDER,['home','tools','living','weekend','kids','services']);
  assert.equal(href('privacy'),'/privacy/');
  assert.deepEqual(readRoute('/privacy/'),{route:'privacy',tab:'',q:'',at:''});
  assert.equal(normalizeLocation({pathname:'/privacy'}),'/privacy/');
  assert.equal(legacyHashPath('#/privacy'),'/privacy/');
  const page=PAGES.find(page=>page.path==='/privacy/');
  assert.equal(page.zh.title,'隐私政策 · Hamilton Local');
  assert.equal(page.en.title,'Privacy Policy · Hamilton Local');
  const html=renderDocument(fs.readFileSync('index.html','utf8'),page);
  assert.ok(html.includes('<title>隐私政策 · Hamilton Local</title>'));
  assert.ok(html.includes('<link rel="canonical" href="https://hamiltonlocal.nz/privacy/">'));
  assert.equal((renderSitemap().match(/<loc>https:\/\/hamiltonlocal\.nz\/privacy\/<\/loc>/g)||[]).length,1);
});
