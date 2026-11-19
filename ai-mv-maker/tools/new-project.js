// 新建一个 MV 项目：node tools/new-project.js 我的歌 "D:\下载\我的歌.mp3"
const fs = require('fs'), path = require('path');
const [name, song] = process.argv.slice(2);
if (!name) { console.log('用法：node tools/new-project.js 项目名 歌曲文件路径'); process.exit(1); }
const ROOT = path.resolve(__dirname, '..'), dir = path.join(ROOT, 'projects', name);
if (fs.existsSync(dir)) { console.log('已经有这个项目了：' + dir); process.exit(1); }
fs.cpSync(path.join(ROOT, 'templates', 'project'), dir, { recursive: true });
fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
if (song) {
  if (!fs.existsSync(song)) { console.log('找不到歌曲文件：' + song); process.exit(1); }
  const ext = path.extname(song) || '.mp3'; fs.copyFileSync(song, path.join(dir, 'song' + ext));
  const cfg = path.join(dir, 'config.js'); fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace("song: 'song.mp3'", `song: 'song${ext}'`));
}
console.log('项目已建好：' + dir + (song ? '' : '\n还没放歌：把歌复制进去，命名为 song.mp3'));
