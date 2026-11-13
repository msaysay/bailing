// 生成组件演示用的素材：三张网页截图（含元素坐标）和一段示例录屏。全部是本目录下的虚构示例页面。
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const out=process.argv[2],dir=__dirname;
(async()=>{const b=await chromium.launch();
 // 长页面：全页 2 倍截图 + 元素坐标（归一化到整页）
 let p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});await p.goto('file://'+path.join(dir,'page1.html'));
 const size=await p.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}));const rois={};
 for(const id of ['t','s1','cell','quote','chart','s2','btn']){const r=await p.locator('#'+id).boundingBox();const sy=await p.evaluate(()=>window.scrollY);rois[id]={x:r.x/size.w,y:(r.y+sy)/size.h,w:r.width/size.w,h:r.height/size.h};}
 await p.screenshot({path:path.join(out,'page-long.png'),fullPage:true});fs.writeFileSync(path.join(out,'page-long.json'),JSON.stringify({width:size.w*2,height:size.h*2,rois},null,1));
 await p.screenshot({path:path.join(out,'page1.png')});
 for(const n of [2,3]){await p.goto('file://'+path.join(dir,`page${n}.html`));await p.screenshot({path:path.join(out,`page${n}.png`)});
   if(n===2){const r={};for(const id of ['h1','h2','h3']){const q=await p.locator('#'+id).boundingBox();r[id]={x:q.x/1280,y:q.y/720,w:q.width/1280,h:q.height/720};}fs.writeFileSync(path.join(out,'page2.json'),JSON.stringify({width:2560,height:1440,rois:r},null,1));}}
 await p.close();
 // 录屏：滚动、移动鼠标、点击
 const c=await b.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});p=await c.newPage();await p.goto('file://'+path.join(dir,'page1.html'));
 await p.waitForTimeout(900);for(let i=0;i<60;i++){await p.mouse.wheel(0,14);await p.waitForTimeout(33);}await p.waitForTimeout(700);
 await p.mouse.move(400,300,{steps:20});await p.waitForTimeout(300);for(let i=0;i<50;i++){await p.mouse.wheel(0,16);await p.waitForTimeout(33);}await p.waitForTimeout(900);
 for(let i=0;i<70;i++){await p.mouse.wheel(0,-24);await p.waitForTimeout(25);}await p.waitForTimeout(600);await p.mouse.move(1130,32,{steps:25});await p.waitForTimeout(700);
 const v=await p.video().path();await c.close();fs.renameSync(v,path.join(out,'screen.webm'));await b.close();console.log(size,Object.keys(rois));})();
