const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
function load(){const result=esbuild.buildSync({entryPoints:['src/agenda-dates.ts'],bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(m,m.exports,require);return m.exports;}
test('calendar dates have a Chinese and an English label',()=>{
 const {chineseDate,englishDate}=load();
 assert.equal(chineseDate('2026-11-28'),'11月28日 周六');
 assert.equal(englishDate('2026-11-28'),'Sat 28 Nov');
 assert.equal(englishDate('2026-11-29'),'Sun 29 Nov');
 assert.equal(englishDate('2027-01-01'),'Fri 1 Jan');
 assert.doesNotMatch(englishDate('2026-12-07'),/[㐀-鿿]/);
});
