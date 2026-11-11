// Reuse the unchanged v22 suite. Allow only the new scoped CSS integration and
// save its evidence separately so original v22 screenshots/reports stay intact.
const fs=require('fs'),path=require('path'),Module=require('module');
let source=fs.readFileSync(path.join(__dirname,'qa-v22.cjs'),'utf8');
source=source.replace("out=path.resolve(__dirname,'../out')","out=path.resolve(__dirname,'../out/regression-v22b')");
source=source.replace("['work/public/licenses/window-scenes.md','work/src/App.tsx'","['work/src/styles.css','work/public/licenses/window-scenes.md','work/src/App.tsx'");
const suite=new Module(path.join(__dirname,'qa-v22b-regression-run.cjs'),module);
suite.filename=path.join(__dirname,'qa-v22b-regression-run.cjs');suite.paths=module.paths;suite._compile(source,suite.filename);
