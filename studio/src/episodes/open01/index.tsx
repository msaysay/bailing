// 开头片花 5.4 秒：「我宣布，短视频剪辑正式进入 AI 时代。看到最后，我把这套工作流的核心内容发给你。」
// 竖屏 1080×1920。三拍：① 怼脸大特写 + 「我宣布」砸字 ② 人收到上半屏，标题三连砸，下面三块屏同时放同一段原片的三种剪法
// ③ 三块屏压暗，中间弹出「看到最后 → 发你」的卡。素材在 studio/public/open01/（不进仓库）：me.mp4、voice.wav、d1/d2/d3.mp4。
// 字的时刻取自语音识别的逐字时间（见下面 T），换原片要重量。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const OPEN_FPS = 30, OPEN_FRAMES = 162;
// 逐字时间（秒）：我0.00 宣布啊 | 短0.54 视频剪辑 | 正1.38 式进入 | AI 2.10 时代 | 你2.64 看到最后 | 我3.18 会把…发给你5.04
const T = { announce: 0.0, short: 0.54, enter: 1.38, ai: 2.1, stay: 2.64, give: 3.18, end: 5.3 };
const FACE = { x: 1010, y: 475 };   // 人脸在 1920×1080 原片里的中心
const GOLD = '#FFD84A', CY = '#3CF0FF', MG = '#FF3D8B';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const back = (x: number) => { const p = Math.max(0, Math.min(1, x)), c = 2.2; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };   // 冲过头再回来
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const TITLE = '"Open Title", "PingFang SC", sans-serif', NUM = '"Open Num", "Open Title", sans-serif';
const useOpenFonts = () => {
  const [h] = React.useState(() => delayRender('open-fonts'));
  React.useEffect(() => {
    Promise.all([['Open Title', 'PangMenZhengDaoBiaoTi.ttf'], ['Open Num', 'AlimamaShuHeiTi-Bold.ttf']].map(([fam, f]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`).load().then((x) => document.fonts.add(x)).catch(() => undefined))).then(() => continueRender(h));
  }, [h]);
};
/** 砸进来的一行大字：从 2.4 倍带模糊砸到 1 倍，落地时有色散重影，然后抖两下。 */
const Slam: React.FC<{ text: string; at: number; out?: number; y: number; size: number; color?: string; t: number; font?: string; glow?: string }> = ({ text, at, out = 99, y, size, color = '#fff', t, font = TITLE, glow }) => {
  if (t < at - 0.01 || t > out + 0.15) return null;
  const p = ease((t - at) / 0.16), q = 1 - ease((t - out) / 0.12), s = interpolate(p, [0, 1], [2.4, 1]), split = (1 - ease((t - at) / 0.35)) * 16;
  const shake = t - at < 0.3 ? (rnd(Math.floor(t * 60)) - 0.5) * 14 * (1 - (t - at) / 0.3) : 0;
  const base: React.CSSProperties = { position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: font, fontSize: size, lineHeight: 1, letterSpacing: 4, whiteSpace: 'nowrap', transform: `translate(${shake}px, ${-shake * 0.6}px) scale(${s}) skewX(-7deg)`, filter: `blur(${(1 - p) * 18}px)`, opacity: Math.min(1, p * 2) * q };
  return (
    <>
      <div style={{ ...base, color: CY, transform: `${base.transform} translateX(${-split}px)`, mixBlendMode: 'screen', opacity: (base.opacity as number) * 0.9 }}>{text}</div>
      <div style={{ ...base, color: MG, transform: `${base.transform} translateX(${split}px)`, mixBlendMode: 'screen', opacity: (base.opacity as number) * 0.9 }}>{text}</div>
      <div style={{ ...base, color, WebkitTextStroke: `${Math.round(size * 0.07)}px rgba(6,8,14,.92)`, paintOrder: 'stroke fill', textShadow: glow ? `0 0 50px ${glow}, 0 8px 0 rgba(0,0,0,.5)` : '0 8px 0 rgba(0,0,0,.5)' }}>{text}</div>
    </>
  );
};
/** 一块小屏：放一种剪法的成片，带标签，按顺序飞进来。 */
const Screen: React.FC<{ src: string; x: number; y: number; w: number; h: number; rot: number; at: number; label: string; t: number; dim: number; from: number }> = ({ src, x, y, w, h, rot, at, label, t, dim, from }) => {
  const { fps } = useVideoConfig(); if (t < at - 0.01) return null;
  const p = back((t - at) / 0.42), float = Math.sin((t - at) * 2.2 + x) * 6;
  return (
    <div style={{ position: 'absolute', left: x, top: y + float + (1 - p) * 700, width: w, transform: `rotate(${rot * p + (1 - p) * rot * 6}deg) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, (t - at) / 0.1), filter: `brightness(${1 - dim * 0.62}) saturate(${1 - dim * 0.4})` }}>
      <div style={{ width: w, height: h, borderRadius: 26, overflow: 'hidden', border: `4px solid rgba(255,255,255,.92)`, boxShadow: `0 0 0 2px rgba(0,0,0,.6), 0 0 46px rgba(60,240,255,.45), 0 30px 60px rgba(0,0,0,.7)`, background: '#000' }}>
        <Sequence from={Math.round(at * fps)} layout="none"><OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(from * fps)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Sequence>
      </div>
      <div style={{ marginTop: 14, textAlign: 'center', fontFamily: TITLE, fontSize: 34, letterSpacing: 2, color: '#0B0E14', background: GOLD, borderRadius: 10, padding: '6px 0', transform: 'skewX(-7deg)', boxShadow: '0 6px 0 rgba(0,0,0,.45)' }}>{label}</div>
    </div>
  );
};
export const OPEN01: React.FC = () => {
  useOpenFonts();
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  // 人物：第一拍铺满（1.78 倍，怼脸），0.5 秒起收成上半屏（1.02 倍）
  const k = ease((t - (T.short - 0.06)) / 0.24), s = interpolate(k, [0, 1], [1.78, 1.02]), cx = 540, cy = interpolate(k, [0, 1], [820, 470]);
  const punch = 1 + 0.05 * (1 - ease((t - T.ai) / 0.4)) * (t >= T.ai ? 1 : 0) + 0.03 * (1 - ease(t / 0.3));           // 「AI 时代」和开场各顶一下
  const boxH = interpolate(k, [0, 1], [1920, 880]);
  const hit = (at: number, d = 0.14) => (t >= at ? Math.max(0, 1 - (t - at) / d) : 0);
  const flash = Math.max(hit(T.ai, 0.2) * 0.9, hit(T.short, 0.1) * 0.35, hit(T.stay, 0.12) * 0.4, t > T.end - 0.1 ? Math.min(0.7, (t - (T.end - 0.1)) / 0.1) : 0);
  const dim = ease((t - T.stay) / 0.3), cardP = back((t - T.stay - 0.05) / 0.4), bar = interpolate(t, [T.give, T.end], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: '#05070D', overflow: 'hidden' }}>
      {/* 底：网格 + 两团光，随时间慢慢漂 */}
      <AbsoluteFill style={{ background: `radial-gradient(900px 700px at ${50 + Math.sin(t * 0.9) * 12}% 72%, rgba(40,90,255,.34), transparent 70%), radial-gradient(700px 600px at ${30 + Math.cos(t * 0.7) * 10}% 95%, rgba(255,61,139,.22), transparent 70%)` }} />
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(120,170,255,.10) 2px, transparent 2px), linear-gradient(90deg, rgba(120,170,255,.10) 2px, transparent 2px)', backgroundSize: '90px 90px', backgroundPosition: `0 ${(t * 60) % 90}px`, maskImage: 'linear-gradient(180deg, transparent 40%, #000 75%)', WebkitMaskImage: 'linear-gradient(180deg, transparent 40%, #000 75%)' }} />
      {/* 人物 */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: boxH, overflow: 'hidden' }}>
        <OffthreadVideo src={staticFile('open01/me.mp4')} muted style={{ position: 'absolute', left: cx - FACE.x * s * punch, top: cy - FACE.y * s * punch, width: 1920 * s * punch, height: 1080 * s * punch, maxWidth: 'none', filter: 'contrast(1.08) saturate(1.12)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,7,13,0) 62%, rgba(5,7,13,.96) 100%)', opacity: k }} />
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 160px rgba(0,0,0,.55)' }} />
      </div>
      {/* 第一拍：「我宣布」 */}
      <Slam text="我宣布" at={T.announce - 0.09} out={T.short - 0.04} y={1180} size={300} t={t} color="#fff" glow="rgba(60,240,255,.7)" />
      {t < T.short && <div style={{ position: 'absolute', left: 0, right: 0, top: 1500, textAlign: 'center', fontFamily: NUM, fontSize: 40, letterSpacing: 18, color: 'rgba(255,255,255,.75)', opacity: ease((t + 0.1) / 0.2) }}>OFFICIAL ANNOUNCEMENT</div>}
      {/* 第二拍：标题三连砸 */}
      <Slam text="短视频剪辑" at={T.short} y={840} size={150} t={t} out={T.end} />
      <Slam text="正式进入" at={T.enter} y={1010} size={104} t={t} out={T.ai - 0.08} color="rgba(255,255,255,.92)" />
      <Slam text="AI 时代" at={T.ai} y={985} size={236} t={t} out={T.end} color={GOLD} font={NUM} glow="rgba(255,216,74,.85)" />
      {/* 「AI 时代」落地时的一圈冲击波和扫光 */}
      {t >= T.ai && t < T.ai + 0.6 && <div style={{ position: 'absolute', left: 540, top: 1100, width: 0, height: 0 }}><div style={{ position: 'absolute', left: -700 * ease((t - T.ai) / 0.6), top: -700 * ease((t - T.ai) / 0.6), width: 1400 * ease((t - T.ai) / 0.6), height: 1400 * ease((t - T.ai) / 0.6), borderRadius: '50%', border: `${10 * (1 - ease((t - T.ai) / 0.6))}px solid ${GOLD}`, opacity: 1 - ease((t - T.ai) / 0.6) }} /></div>}
      {/* 三块屏：同一段原片，三种剪法，同时在放 */}
      <Screen src="open01/d1.mp4" x={34} y={1296} w={292} h={500} rot={-5} at={T.short + 0.14} label="快节奏风" t={t} dim={dim} from={0.3} />
      <Screen src="open01/d3.mp4" x={352} y={1340} w={376} h={250} rot={0} at={T.enter + 0.1} label="横屏深度风" t={t} dim={dim} from={0.3} />
      <Screen src="open01/d2.mp4" x={754} y={1296} w={292} h={500} rot={5} at={T.short + 0.38} label="财经解读风" t={t} dim={dim} from={0.3} />
      {t >= T.ai + 0.15 && <div style={{ position: 'absolute', left: 352, top: 1690, width: 376, textAlign: 'center', fontFamily: TITLE, fontSize: 30, lineHeight: 1.25, color: '#fff', opacity: ease((t - T.ai - 0.15) / 0.2) * (1 - dim), transform: 'skewX(-7deg)' }}>同一段原片<br /><span style={{ color: CY }}>AI 自动剪出 3 种</span></div>}
      {/* 第三拍：看到最后，发你 */}
      {t >= T.stay && (
        <div style={{ position: 'absolute', left: 70, right: 70, top: 1300, height: 470, transform: `scale(${0.5 + 0.5 * cardP}) rotate(${(1 - cardP) * -6}deg)`, opacity: Math.min(1, (t - T.stay) / 0.12), borderRadius: 40, background: 'linear-gradient(160deg, rgba(20,26,44,.96), rgba(8,10,18,.96))', border: `5px solid ${GOLD}`, boxShadow: `0 0 80px rgba(255,216,74,.5), 0 40px 80px rgba(0,0,0,.8)`, padding: '40px 50px', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: TITLE, fontSize: 64, color: '#fff', transform: 'skewX(-7deg)', display: 'flex', alignItems: 'center', gap: 20 }}><span style={{ background: MG, borderRadius: 12, padding: '4px 22px' }}>看到最后</span><span style={{ fontFamily: NUM, color: GOLD, transform: `translateX(${Math.sin(t * 14) * 10}px)` }}>→→</span></div>
          <div style={{ fontFamily: TITLE, fontSize: 112, lineHeight: 1.15, color: GOLD, marginTop: 26, transform: 'skewX(-7deg)', textShadow: '0 0 40px rgba(255,216,74,.5)', opacity: ease((t - T.give) / 0.2), clipPath: `inset(0 ${100 - ease((t - T.give) / 0.5) * 100}% 0 0)` }}>这套工作流</div>
          <div style={{ fontFamily: TITLE, fontSize: 82, color: '#fff', marginTop: 6, transform: 'skewX(-7deg)', opacity: ease((t - T.give - 0.9) / 0.2) }}>核心内容 <span style={{ color: CY }}>发给你</span></div>
          <div style={{ position: 'absolute', left: 50, right: 50, bottom: 38, height: 14, borderRadius: 7, background: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><div style={{ width: `${bar * 100}%`, height: '100%', background: `linear-gradient(90deg, ${CY}, ${GOLD})` }} /></div>
        </div>
      )}
      {/* 扫描线、闪白 */}
      <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,.035) 0 2px, transparent 2px 6px)', mixBlendMode: 'overlay' }} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash * 0.85 }} />
      <Audio src={staticFile('open01/voice.wav')} />
      {[[0, 'thud.wav', 0.8], [T.short, 'thud.wav', 0.5], [T.short + 0.14, 'whoosh.wav', 0.35], [T.enter, 'tick.wav', 0.6], [T.ai, 'thud.wav', 1], [T.stay, 'whoosh.wav', 0.5], [T.give, 'tick.wav', 0.5]].map(([at, file, v], i) => <Sequence key={i} from={Math.round((at as number) * fps)} layout="none"><Audio src={staticFile('sfx/' + file)} volume={(v as number) * 0.5} /></Sequence>)}
    </AbsoluteFill>
  );
};
