// 宠物 HUD 演示：左下角宠物出场 → 本期 +经验 → 升级、破冰换形态 → 小反应 → 片尾亮出路线分数。数字是示意。
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useFonts } from '../../kit/kit';
import { PetHud, RouteRace } from '../../components/pet';
export const PET_DEMO_SEC = 10;
export const PetDemo: React.FC = () => { useFonts(); return (
  <AbsoluteFill style={{ background: '#0B0E14' }}>
    <Img src={staticFile('gallery/img2.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .55 }} />
    <div style={{ position: 'absolute', left: 30, bottom: 20 }}>
      <PetHud name="小浮" form="egg3" stage="egg" level={4} cur={1600} next={1118} at={.2}
        gain={{ at: 1.6, amount: 1260, toLevel: 5, toCur: 380, toNext: 1470 }}
        events={[{ at: 2.6, kind: 'evolve', form: 'hatch', text: '破冰啦！' }, { at: 5.2, kind: 'react', form: 'young-happy', text: '谢谢大家～' }, { at: 7, kind: 'react', form: 'young' }]} />
    </div>
    <div style={{ position: 'absolute', right: 80, top: 120 }}><RouteRace at={6.6} scores={{ tech: 31, gold: 18, flame: 9, star: 24 }} title="它会长成什么？（示意）" /></div>
  </AbsoluteFill>
); };
