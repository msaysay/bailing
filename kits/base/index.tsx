// 积木版入口：不用改。studio/src/packs/ 里每个文件是一个包登记的合成，这里自动全部登记；
// 每期片子由 scripts/episode.py new 登记到 episodes/_registry.tsx。装包、卸包只要增删 packs/ 里的文件。
import React from 'react';
import { registerRoot } from 'remotion';
import { Registered } from './episodes/_registry';
// @ts-ignore 打包工具提供的：把 packs 文件夹里的 tsx 全部引进来
const ctx = require.context('./packs', false, /\.tsx$/);
registerRoot(() => <><Registered />{ctx.keys().map((k: string) => { const M = ctx(k).default; return <M key={k} />; })}</>);
