const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
function load(){
 const result=esbuild.buildSync({entryPoints:['src/card-style.ts'],bundle:true,platform:'node',format:'cjs',write:false});
 const m={exports:{}};new Function('module','exports',result.outputFiles[0].text)(m,m.exports);
 return m.exports;
}
test('cards query defaults to current style; only a, b, c switch',()=>{
 const {readCardStyle}=load();
 assert.equal(readCardStyle('', '#/living?tab=places'), '');
 assert.equal(readCardStyle('?hero=window', '#/kids'), '');
 assert.equal(readCardStyle('?cards=d', '#/living'), '');
 assert.equal(readCardStyle('?cards=A', '#/'), '');
 assert.equal(readCardStyle('?cards=a', '#/living?tab=places'), 'a');
 assert.equal(readCardStyle('?cards=b', '#/kids'), 'b');
 assert.equal(readCardStyle('?cards=c', ''), 'c');
});
test('hash cards param is accepted; page search is used when hash has none',()=>{
 const {readCardStyle}=load();
 assert.equal(readCardStyle('', '#/living?tab=places&cards=b'), 'b');
 assert.equal(readCardStyle('?cards=a', '#/living?tab=places&cards=c'), 'c');
 assert.equal(readCardStyle('?cards=a', '#/living?tab=places'), 'a');
});
test('applyCardStyle writes data-cards only for a, b, c',()=>{
 const {applyCardStyle}=load();
 const el={attributes:{}, setAttribute(k,v){this.attributes[k]=v;}, removeAttribute(k){delete this.attributes[k];}, getAttribute(k){return this.attributes[k]??null;}};
 const doc={documentElement:el};
 applyCardStyle(doc, '');
 assert.equal(el.getAttribute('data-cards'), null);
 applyCardStyle(doc, 'a');
 assert.equal(el.getAttribute('data-cards'), 'a');
 applyCardStyle(doc, 'b');
 assert.equal(el.getAttribute('data-cards'), 'b');
 applyCardStyle(doc, '');
 assert.equal(el.getAttribute('data-cards'), null);
});
test('place quick-info uses existing area, distance, free flag and tag only',()=>{
 const {placeQuickInfo}=load();
 assert.deepEqual(placeQuickInfo({area:'Hamilton East',km:3,free:true,tag:'世界主题花园'},'zh'),[
  {key:'area',text:'Hamilton East'},
  {key:'km',text:'约3 km'},
  {key:'price',text:'免费'},
  {key:'tag',text:'世界主题花园'},
 ]);
 assert.deepEqual(placeQuickInfo({area:'Hamilton West',km:6,free:false,tag:'See the animals'},'en'),[
  {key:'area',text:'Hamilton West'},
  {key:'km',text:'~6 km'},
  {key:'price',text:'Paid'},
  {key:'tag',text:'See the animals'},
 ]);
 assert.deepEqual(placeQuickInfo({area:'Newstead'},'en'),[{key:'area',text:'Newstead'}]);
});
