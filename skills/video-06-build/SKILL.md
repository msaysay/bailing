---
name: video-06-build
description: 在 studio 工程里为一期视频写场景代码：登记镜头与口播的对应、用组件库搭出每段画面、配置字幕让位和关键词变色、加音乐和音效。规划确认之后使用。
---

# 第 6 步 · 写场景

## 输入
`规划.md`、`timing.json`、镜头片段、`faces.json`。

## 输出
`studio/src/episodes/<期>/` 下：
- `shots.json`：镜头与口播的对应
- `part1.tsx`、`part2.tsx`……：场景
- `index.tsx`：把时钟、实拍层、场景、常驻层、声音装到一起
- 在 `studio/src/index.tsx` 里注册这一期的 Composition（整片，以及只到第一段结束的预览）

以 `studio/src/episodes/ep02/` 为范例照着写。

## 镜头登记 `shots.json`

```json
{ "file": "p1-open.mp4", "from": "seg:开场", "to": "seg:开场:end", "credit": "X @Reuters", "faceTo": [0.82, 0.32] }
```

- `from` / `to`：`seg:段名`（段起点）、`seg:段名:end`（段终点）、`say:段名:词`（那个词被念到前 0.2 秒）。
- `old: true`：做旧并标「示意画面，非当年影像」，用于没有当年影像的历史段落。
- `dim`：压暗程度，默认 0.66；只留画面的段落用 0.3，背景太亮抢字时用 0.8。
- `faceTo`：把这个镜头里的人脸挪到画面的这个位置（横、纵比例）。

## 场景

```tsx
const { seg, say } = useClock();
<Scene from={seg('市场').start} to={say('市场', '高盛') - 0.2}>
  <Stage style={{ paddingTop: 200 }}>
    <Pop at={say('市场', '盘中跌')}>…</Pop>
    <TargetCard firm="高盛" from={300} to={220} at={say('市场', '高盛')} cutAt={say('市场', '220') - 0.2} src="机构 · 日期" />
  </Stage>
</Scene>
```

- 所有时刻用 `say()` / `seg()`。组件的时间参数都是秒。
- 颜色、字号从 `kit` 取（`C.accent`、`C.down`、`C.warm`、`C.muted`），不手写色值。全片只有底色、文字色、一个强调色、一个警示色，外加少量暖色点缀。
- 动画只能由当前帧决定：不用 `Date.now()`、`Math.random()`、CSS 动画。要随机就用固定种子。
- `Stage` 四周留边：上 150、左右 140、下 190（下方是字幕）。
- 新做的组件放进 `studio/src/components/`，并在 `studio/src/gallery/` 下对应的 `catalog-*.tsx` 里登记名称、适用、不适用、参数、演示（新开一组就新建一个目录文件并加进 `all.ts`）；登记后用 `tools/gallery_check.sh <起始序号> <个数> <输出.jpg>` 只渲这几个看一眼，不用重渲整条演示片。

## 字幕与强调

在这一期的 `index.tsx` 里：

```ts
const hero = [clock.ln('论点', '一个人的丑闻')];   // 这些行由强调字幕承担，底部字幕隐藏
const hot = ['1996', '14%', '220'];               // 底部字幕里要变色的词
```

强调字幕用 `KineticLine`，`words` 里的每个词必须能在那一行字幕里找到。

## 声音

- 人声：`voice.wav`。
- 背景音乐：选冷静、不抢人声的；音量约为人声的三成，片头淡入、片尾淡出。登记作者和许可，需要署名的在片尾和简介里署名。
- 音效：只给章节页、翻牌、强调句、盖章这类时刻；全片不超过 15 记，音量不超过 0.5。

## 顺序

1. 先做第一段（开场到第一个大部分结束），注册一个预览 Composition，渲出来走第 7 步，给用户看。
2. 用户认可后铺全片。
3. 写完跑 `npx tsc --noEmit`；再跑一遍「所有 `say()` 的词都找得到」的检查。

## 放行条件
类型检查通过；第一段经用户确认。
