// Conservative photo bounds: assume the darkest possible pixel below each overlay.
module.exports = async page => page.evaluate(() => {
  const rgb = v => { const m=v.match(/[\d.]+/g); return m?m.map(Number):[0,0,0,0]; };
  const over = (f,b) => f.slice(0,3).map((v,i)=>v*(f[3]??1)+b[i]*(1-(f[3]??1)));
  const lum = c => c.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
  const ratio = (a,b) => (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
  const failures=[],samples=[],seen=new Set();
  for(const el of document.querySelectorAll('.ia-root *')){
    const text=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
    if(!text||el.closest('script,style,option,.v20-sr-only,.sr-only,.leaflet-control-attribution'))continue;
    const s=getComputedStyle(el),r=el.getBoundingClientRect();if(!r.width||!r.height||s.visibility==='hidden'||s.display==='none')continue;
    const ancestors=[];let p=el;while(p&&p!==document.documentElement){ancestors.unshift(p);p=p.parentElement;}
    if(ancestors.some(a=>Number(getComputedStyle(a).opacity)===0))continue;
    let bg=[247,243,235],start=0;const hero=el.closest('.sb-hero'),teaser=el.closest('.ia-teaser');
    if(hero){bg=over([247,243,235,199/255],[0,0,0]);start=ancestors.indexOf(hero)+1;}
    else if(teaser){bg=over([255,252,246,.4],over([0,0,0,.32],[243,236,223]));start=ancestors.indexOf(teaser)+1;}
    else if(el.closest('.ia-page-intro,.ia-content')){bg=over([247,243,235,230/255],[0,0,0]);start=ancestors.findIndex(a=>a.matches('.ia-page-intro,.ia-content'));}
    for(const a of ancestors.slice(start))bg=over(rgb(getComputedStyle(a).backgroundColor),bg);
    let fg=over(rgb(s.color),bg);const opacity=ancestors.reduce((n,a)=>n*Number(getComputedStyle(a).opacity),1);fg=over([...fg,opacity],bg);
    const value=ratio(fg,bg),large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700);
    const sample={text:text.slice(0,72),selector:el.tagName.toLowerCase()+'.'+[...el.classList].join('.'),ratio:+value.toFixed(2),required:large?3:4.5,color:s.color,background:bg.map(Math.round),photoBound:!!(hero||teaser)};
    const key=JSON.stringify([s.color,bg,large,el.className]);if(!seen.has(key)){samples.push(sample);seen.add(key);}if(value+.005<sample.required)failures.push(sample);
  }
  return {sampleCount:samples.length,minRatio:Math.min(...samples.map(s=>s.ratio)),failures,samples};
});
