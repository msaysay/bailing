'use strict';
// 实测 MiMo 润色：模拟一段口语转写，看整理效果 + 场景/风格注入是否生效。
const { polish } = require('../src/main/polish');

const RAW =
  '嗯那个我想说的就是说啊咱们这个百灵这个项目呢它的核心就是那个越用越懂我嘛' +
  '然后呢就是它跟别的语音输入不一样的地方在于说它会自己学我的说话习惯然后' +
  '呃术语这块儿我们可以从那个obsidian里面导进来对就这样';

async function run() {
  console.log('=== 原始口语 ===\n' + RAW + '\n');

  const scenes = [
    { scene: 'chat', label: '微信聊天档' },
    { scene: 'doc', label: '文档写作档' },
    { scene: 'code', label: '技术/代码档' },
  ];

  for (const s of scenes) {
    const t0 = Date.now();
    try {
      const out = await polish(RAW, {
        scene: s.scene,
        style: '说话偏口语、直接，喜欢用短句，技术圈背景，中英夹杂习惯保留英文原词',
        terms: ['百灵', 'Obsidian', 'MiMo'],
      });
      console.log(`=== ${s.label}（${Date.now() - t0}ms） ===\n${out}\n`);
    } catch (e) {
      console.error(`[${s.label}] 失败:`, e.message);
    }
  }
}

run();
