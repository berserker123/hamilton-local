const {test}=require('node:test'),assert=require('node:assert/strict'),esbuild=require('esbuild');
test('facility and region filters combine; unknown facilities never imply yes',()=>{
 const r=esbuild.buildSync({entryPoints:['src/playground-filters.ts'],bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);
 const data=[{id:'a',area:'North',toilets:true},{id:'b',area:'North',toilets:null},{id:'c',area:'East',toilets:true}];
 assert.deepEqual(m.exports.filterPlaygrounds(data,'North','toilets').map(x=>x.id),['a']);
 assert.equal(m.exports.filterPlaygrounds(data,'all','all').length,3);
 assert.equal(m.exports.filterPlaygrounds(data,'West','toilets').length,0);
});
