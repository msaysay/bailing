const {chromium}=require('playwright'),fs=require('fs');(async()=>{
const [,, html, outPng, outJson] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1480,height:760}, deviceScaleFactor:2});
await p.goto('file://'+html); const r = await p.locator('#target').boundingBox();
const size = await p.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}));
await p.screenshot({path:outPng, fullPage:true});
const roi={x:r.x/size.w,y:r.y/size.h,width:r.width/size.w,height:r.height/size.h};
fs.writeFileSync(outJson, JSON.stringify({sourceWidth:size.w*2,sourceHeight:size.h*2,regions:[roi]},null,1)); console.log(size, roi); await b.close();})();
