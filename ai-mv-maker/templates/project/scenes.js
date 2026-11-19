// 场景表：一个场景一行。场景函数写在下面（或者用 styles 里现成的、imageScene 做的）。
// 每个场景函数的参数：(ctx 画布, T 原曲秒数, A 节拍响度 {kick, env}, t 场景内秒数, u 场景进度 0→1)
// 场景表字段：a 开始秒数 | f 场景函数 | ly 歌词高度（像素，画面 1080×1920） | x 转场秒数
//   fx 转场：'dissolve' 溶解（默认）/ 'white' 白闪 / 'black' 黑闪 / 'burn' 胶片烧 / 'zoom' 冲进去 / 'wipe' 擦除
//   lyric 这一场的歌词样式（覆盖 config）| dark: true 亮背景配深色字 | leak 漏光 0–1 | grade 调色 ['#色', 强度] | camera 运镜 | shake 鼓点抖动幅度

function sExample(ctx, T, A, t, u) {
  sky(ctx, ['#1c2a66', '#5a5fa8', '#e89a9a', '#ffcf9a'], 0, 1400);
  stars(ctx, T, 120, 1 - u, 700, 3);
  sun(ctx, 540, 1250 - u * 200, 90 + A.kick * 8, '#fff6d8', '#ffa060', 1);
  cloudBand(ctx, T, 6, 300, 1000, .7, 1.5, '#ffc8a8', .5, 4, 8, '#7a6aa8');
  ridge(ctx, 1380, 140, .0016, 11, t * 8, vgrad(ctx, 1240, 1600, '#4a3f80', '#b0788c'));
  ridge(ctx, 1520, 90, .002, 12, t * 16, '#120d24');
  figure(ctx, { x: 200 + u * 600, y: 1505, h: 200, ph: t * 4.4, col: '#0a0818', rim: '#ffc890', pack: true });
  grass(ctx, T, 0, 120, 40, 140, '#07060f', 3, 1, x => 1600 + 30 * Math.sin(x * .01));
}

const SCENES = [
  { a: 0, f: sExample, ly: 520, x: 0 },
];
