const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const routes=()=>import('../src/site-routes.mjs');

test('every current section and tab round-trips through a canonical trailing-slash URL',async()=>{
  const {PAGES,readRoute,href,legacyHashPath}=await routes();
  const tabs={tools:['bins','lookup','urgent','bus','pay','checklist','gst','units','seasonal','other'],living:['grocers','dining','places','upick','stays','blackfriday'],weekend:['picks','markets'],kids:['map','places','parties'],services:['home','trades','daily','pets','advisors']};
  const sectionPages=PAGES.filter(p=>!p.path.startsWith('/talk/'));
  assert.equal(sectionPages.length,34);
  assert.ok(!PAGES.some(p=>p.path.startsWith('/news/')));
  assert.deepEqual(readRoute('/news/'),{route:'talk',tab:'',q:'',at:''});
  assert.deepEqual(readRoute('/news/old-story/'),{route:'talk',tab:'',q:'',at:''});
  assert.equal(href('home'),'/');
  for(const [route,items] of Object.entries(tabs)){
    const section=route==='weekend'?'whatson':route;
    assert.ok(PAGES.some(p=>p.path===`/${section}/`));
    for(const tab of items){
      const path=`/${section}/${tab}/`;
      assert.equal(href(route,tab),path);
      assert.equal(legacyHashPath('#/'+route+'?tab='+tab),path);
      assert.ok(PAGES.some(p=>p.path===path));
      assert.deepEqual(readRoute(path),{route,tab,q:'',at:''});
    }
  }
});

test('legacy hash aliases preserve search, anchors and display options while moving to real paths',async()=>{
  const {legacyHashPath}=await routes();
  for(const [old,want] of [
    ['#/','/'],['#/tools?tab=bins','/tools/bins/'],
    ['#/living?tab=blackfriday','/living/blackfriday/'],
    ['#/services?tab=advisors','/services/advisors/'],
    ['#/weekend?tab=festivals','/whatson/picks/'],
    ['#/whatson?tab=markets','/whatson/markets/'],
    ['#/tools?tab=transport&q=bus','/tools/bus/?q=bus&at=tool-transport'],
    ['#tool-school-terms','/tools/other/?at=tool-school-terms'],
    ['#pet-vets','/services/pets/?at=pet-vets'],
    ['#/living?tab=pets&q=cat&at=pet-vets','/services/pets/?q=cat&at=pet-vets'],
    ['#/living?tab=places&at=upick','/living/upick/?at=upick'],
    ['#/tools?tab=bins&at=tool-gst&cards=b&hero=window','/tools/gst/?at=tool-gst&cards=b&hero=window'],
    ['#/kids?tab=places&q=%E6%B9%96','/kids/places/?q=%E6%B9%96'],
  ])assert.equal(legacyHashPath(old),want,old);
  assert.equal(legacyHashPath('#overview'),null);
  assert.equal(legacyHashPath('#main'),null);
});

test('canonicalization handles slashless paths, section queries, old path aliases and invalid tabs safely',async()=>{
  const {normalizeLocation,readRoute}=await routes();
  for(const [pathname,search,hash,want] of [
    ['/tools/bins','','','/tools/bins/'],
    ['/living/','?tab=stays&q=lake','','/living/stays/?q=lake'],
    ['/weekend/markets/','','','/whatson/markets/'],
    ['/supermarkets/','','','/living/grocers/'],
    ['/tools/transport/','','','/tools/bus/?at=tool-transport'],
    ['/','?cards=a&hero=window','#/tools?tab=bins','/tools/bins/?cards=a&hero=window'],
    ['/tools/bins/','?q=x','#overview','/tools/bins/?q=x#overview'],
    ['/news','','','/talk/'],
    ['/news/abc','','','/talk/'],
  ])assert.equal(normalizeLocation({pathname,search,hash}),want);
  assert.deepEqual(readRoute('/tools/','?tab=unknown&at=bad'),{route:'tools',tab:'bins',q:'',at:''});
  assert.deepEqual(readRoute('/missing/'),{route:'home',tab:'',q:'',at:''});
});

test('each static document has distinct title, description, canonical and matching social metadata',async()=>{
  const {PAGES,renderDocument,renderSitemap,renderNotFound}=await routes();
  const template=fs.readFileSync('index.html','utf8');
  const titles=new Set(),descriptions=new Set();
  for(const page of PAGES){
    const html=renderDocument(template,page);
    const url='https://hamiltonlocal.nz'+page.path;
    const title=html.match(/<title>(.*?)<\/title>/)[1];
    const description=html.match(/<meta name="description" content="([^"]+)"/)[1];
    titles.add(title);descriptions.add(description);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`),page.path);
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
    assert.ok(html.includes(`<meta property="og:title" content="${title}">`));
    assert.ok(html.includes(`<meta property="og:description" content="${description}">`));
    assert.match(html,/<base href="\/">/);
    assert.match(html,/<div id="root"><\/div>/); // no added visible copy
  }
  assert.equal(titles.size,PAGES.length);assert.equal(descriptions.size,PAGES.length);
  const sitemap=renderSitemap();
  const excluded=['/living/dining/','/services/home/','/services/trades/','/services/daily/','/services/advisors/','/search/'];
  assert.equal((sitemap.match(/<loc>/g)||[]).length,PAGES.filter(p=>!p.noindex).length);
  for(const path of ['/tools/bus/','/living/blackfriday/','/services/pets/','/whatson/picks/'])assert.ok(sitemap.includes('https://hamiltonlocal.nz'+path),path);
  for(const path of excluded){
    assert.ok(!sitemap.includes('<loc>https://hamiltonlocal.nz'+path+'</loc>'),path+' must be excluded from sitemap');
    const page=PAGES.find(p=>p.path===path);
    assert.ok(page&&page.noindex,path+' marked noindex');
    assert.match(renderDocument(template,page),/<meta name="robots" content="noindex">/,path+' HTML has noindex');
  }
  for(const page of PAGES.filter(p=>!p.noindex)){
    assert.doesNotMatch(renderDocument(template,page),/<meta name="robots" content="noindex">/,page.path+' should be indexable');
  }
  for(const [,url] of sitemap.matchAll(/<loc>(.*?)<\/loc>/g))assert.doesNotMatch(url,/#|\?/);
  assert.match(renderNotFound(template),/<meta name="robots" content="noindex">/);
});
