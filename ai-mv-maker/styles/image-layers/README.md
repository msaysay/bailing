# AI 生图动起来

不需要写画画代码：用 `imageScene` / `layerScene` 把一张图变成会动的场景。

1. 按 `reference/AI生图提示词.md` 给每一场生成一张 9:16 竖图，放进 `projects/歌名/assets/`。
2. config.js 的 `styles` 里加上 `'image-layers'`。
3. scenes.js 里：
   ```js
   const s01 = imageScene('assets/01.jpg', 'push', 'petals', { leak: .3 });
   const s02 = layerScene({ layers: [{ src: 'assets/02.jpg' }, { src: 'assets/02_前景.png', depth: 1 }], move: 'left', particles: 'fireflies', glowAt: [540, 850], rays: true });
   const SCENES = [{ a: 15, f: s01, ly: 1450, lyric: 'minimal' }, { a: 27, f: s02, ly: 480 }];
   ```

让图片更好看的四个开关：
- `move`：每场换一种运镜（推、拉、左移、右移、升），相邻两场别一样
- `particles`：花瓣（春、回忆）、萤火（夏夜）、雪（冬、离别）、雨（伤感）、火星（燃）、浮尘（光束里）
- `leak`：漏光 0.2–0.5，回忆和黄昏用
- `glowAt + rays`：在图里太阳或灯的位置加一团会跟鼓点呼吸的光和光束
- 有透明前景 PNG 时，前景会动得比背景多，立体感最强
