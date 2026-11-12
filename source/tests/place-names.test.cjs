const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const esbuild=require('esbuild');
function formatter(){
 const file='src/place-names.ts';
 if(!fs.existsSync(file))return text=>text;
 const result=esbuild.buildSync({entryPoints:[file],bundle:true,platform:'node',format:'cjs',write:false});
 const m={exports:{}};new Function('module','exports',result.outputFiles[0].text)(m,m.exports);
 return m.exports.placeNames;
}
test('Chinese place labels include known English names in headings and prose',()=>{
 const names=formatter();
 assert.equal(names('汉密尔顿'), '汉密尔顿 Hamilton');
 assert.equal(names('其他怀卡托'), '其他怀卡托 Waikato');
 assert.equal(names('剑桥与拉格伦'), '剑桥 Cambridge 与拉格伦 Raglan');
 assert.equal(names('蒂阿瓦穆图 · 特阿瓦穆图 · 玛塔玛塔 · 马塔马塔 · 卡拉皮罗 · 亨特利 · 莫林斯维尔'), '蒂阿瓦穆图 Te Awamutu · 特阿瓦穆图 Te Awamutu · 玛塔玛塔 Matamata · 马塔马塔 Matamata · 卡拉皮罗 Karāpiro · 亨特利 Huntly · 莫林斯维尔 Morrinsville');
 assert.equal(names('格伦维尤社区中心 · 弗兰克顿铁路会堂 · 费尔菲尔德家庭中心 · 普克特 · 特拉帕'), '格伦维尤 Glenview 社区中心 · 弗兰克顿 Frankton 铁路会堂 · 费尔菲尔德 Fairfield 家庭中心 · 普克特 Pukete · 特拉帕 Te Rapa');
});
test('existing English counterparts do not duplicate; unknown names stay unchanged',()=>{
 const names=formatter();
 for(const text of ['汉密尔顿 Hamilton','汉密尔顿花园 Hamilton Gardens','卡拉皮罗 Karāpiro','科罗曼德尔 Coromandel','Hamilton East','未知地名'])assert.equal(names(text),text);
 const once=names('汉密尔顿花园与怀卡托河');assert.equal(names(once),once);
 assert.equal(names('周六 '),'周六 ');
 assert.equal(names(' 剑桥 '),' 剑桥 Cambridge ');
 const rsa=names('玛塔玛塔RSA活动厅');assert.equal(rsa,'玛塔玛塔 Matamata RSA活动厅');assert.equal(names(rsa),rsa);
});
test('raw location fields render English names only in English mode',()=>{
 const names=formatter();
 assert.equal(names('汉密尔顿 · 怀卡托 · 格伦维尤','en'),'Hamilton · Waikato · Glenview');
 assert.equal(names('汉密尔顿 Hamilton','en'),'Hamilton');
 assert.equal(names('Hamilton East','en'),'Hamilton East');
});
