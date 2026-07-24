'use strict';
// 全链路测试（不经 Electron/麦克风）：给一个 wav 文件，跑 ASR -> 润色 -> 术语纠正。
// 需先安装本地 ASR:  pip install -r python/requirements.txt
// 用法:  node scripts/test-pipeline.js path/to/audio.wav [scene]
const pipeline = require('../src/main/pipeline');

async function run() {
  const wav = process.argv[2];
  const scene = process.argv[3] || 'default';
  if (!wav) {
    console.error('用法: node scripts/test-pipeline.js <audio.wav> [chat|doc|code|email|social]');
    process.exit(1);
  }
  const t0 = Date.now();
  const { raw, text, timings } = await pipeline.run(wav, { scene });
  console.log('原始 ASR :', raw);
  console.log('润色结果 :', text);
  console.log('耗时     :', JSON.stringify(timings), `总 ${Date.now() - t0}ms`);
}

run().catch((e) => console.error('失败:', e.message));
