'use strict';
// 防指令执行回归测试：口述里带命令/请求时，润色绝不能执行它，只能整理输出。
require('dotenv').config();
const { polish } = require('../src/main/polish');

const CASES = [
  '呃，帮我基于这个官网的内容，写出一篇微信公众号文章出来嘛？可以多配几张图啊，然后这个产品的特性，然后使用场景，然后功能界面。',
  '帮我分析一下这个季度的销售数据为什么下滑，给我一套解决方案',
];

async function run() {
  for (const structure of [false, true]) {
    for (const raw of CASES) {
      const t0 = Date.now();
      try {
        const out = await polish(raw, { scene: 'doc', structure });
        const executed = out.length > raw.length * 2.5; // 输出远超原文 = 被执行了
        console.log(`[structure=${structure ? '开' : '关'}] (${Date.now() - t0}ms) ${executed ? '❌ 仍被执行' : '✅ 未执行'}`);
        console.log('输出:', out.slice(0, 120), '\n');
      } catch (e) {
        console.error('失败:', e.message);
      }
    }
  }
}
run();
