export const FPS = 30;
export const BEAT = 20; // 帧/拍 → 90 BPM
export const W = 1080;
export const H = 1920;

export type Lane = 'h' | 'j' | 'm';
export type Node = {
  year: number;
  beats: number;
  h?: string;
  j?: string;
  m?: string;
  enter: Partial<Record<Lane, number>>; // 入场拍点
};

// 文案中的 / 表示换行；{b:..} {g:..} 为终章回扣高亮（蓝=乔布斯线，绿=黄仁勋线）
const RAW: [number, string | undefined, string | undefined, string | undefined][] = [
  [1955, '尚未出生', '2月24日生于旧金山/出生后被收养', undefined],
  [1963, '2月17日生于中国台湾台南/祖籍浙江青田', '8 岁，随养父母在硅谷生活', undefined],
  [1972, '9 岁被扔到美国乡下/管教学校里天天扫厕所', '17 岁上大学/半年后辍学，旁听书法课', undefined],
  [1976, '13 岁，在俄勒冈读书', '21 岁和沃兹尼亚克/在车库里创立苹果', undefined],
  [1984, '21 岁以最高荣誉毕业/进芯片公司做设计', '28 岁，发布第一代/图形界面电脑', undefined],
  [1986, '23 岁在芯片公司/从技术岗转做销售', '31 岁，花 1000 万美元/买下皮克斯', '而我，出生了。'],
  [1993, '30 岁，在餐厅里/决定创业，创立英伟达', '38 岁，公司砍掉硬件/裁员只剩 200 人', '在北京门头沟坡头小学/上二年级'],
  [1997, '押上一款新显卡/公司从死亡线上活下来', '42 岁，重回苹果/推出全新品牌广告', '大街小巷都在放《心太软》'],
  [1999, '发布首款 GPU/同年公司上市', '44 岁，推出 iBook 和 AirPort/苹果重回正轨', '学校大合唱《七子之歌》'],
  [2001, '显卡市场登顶全球第一', '46 岁，iPod 发布/音乐产业被重塑', '借英语老师的录音机/放《爱在西元前》'],
  [2003, '图形芯片霸主地位稳固', '48 岁，确诊胰腺肿瘤', '非典来了/居家备战高考/考了个好大专'],
  [2007, '44 岁，CUDA 被华尔街质疑', '52 岁，iPhone 发布', '已经换了 3 份工作/始终不知道自己想干啥'],
  [2008, '45 岁，金融寒冬/市值一度大幅缩水', '53 岁，App Store 上线/手机生态成型', '北京开奥运会了/我进了电视台（编外）'],
  [2010, '47 岁，押注通用计算第五年', '55 岁，iPad 发布', '我结婚了'],
  [2011, '48 岁，还在死磕通用计算/AI 尚无踪影', '56 岁，8 月辞任 CEO/10 月 5 日去世', '媳妇怀孕了'],
  [2016, '把首台人工智能超算/亲手送给 OpenAI', undefined, '和朋友创业 2 年'],
  [2025, '市值破 5 万亿美元/当选《时代》年度人物', undefined, '植发、戒烟、减肥/偶尔听听周杰伦'],
  [2026, '63 岁，11 月 12 日/辞去总裁、CEO 职务', undefined, '拿着{b:苹果}手机/用 {g:AI} 跑了条视频/你看到点了个赞'],
];

export const INTRO_BEATS = 4;
export const INTERLUDE_BEATS = 4; // 2011 之后：乔布斯谢幕
export const BIRTH_IDX = 5; // 1986
export const FAREWELL_IDX = 14; // 2011
export const LAST_IDX = RAW.length - 1;

export const NODES: Node[] = RAW.map(([year, h, j, m], i) => ({
  year,
  h,
  j,
  m,
  beats: i < BIRTH_IDX ? 6 : i === LAST_IDX ? 16 : 8,
  enter: i === BIRTH_IDX ? {h: 0, j: 1, m: 4} : j ? {h: 0, j: 1, m: 2} : {h: 0, m: 2},
}));

// 每个节点的起始帧
export const STARTS: number[] = [];
{
  let b = INTRO_BEATS;
  NODES.forEach((n, i) => {
    STARTS.push(b * BEAT);
    b += n.beats;
    if (i === FAREWELL_IDX) b += INTERLUDE_BEATS;
  });
}
export const ENDS = NODES.map((n, i) => STARTS[i] + n.beats * BEAT);
export const INTERLUDE_START = ENDS[FAREWELL_IDX];
export const DROP = STARTS[BIRTH_IDX] + 4 * BEAT; // “我”登场 = 鼓点进入
export const TOTAL = ENDS[LAST_IDX];

export const BORN = {h: 1963, j: 1955, m: 1986};
// 文案写明的岁数优先
const AGE_OVERRIDE: Record<string, number> = {'j1984': 28};
export const ageAt = (lane: Lane, i: number) =>
  AGE_OVERRIDE[lane + NODES[i].year] ?? NODES[i].year - BORN[lane];

export const C = {
  paper: '#EFE8DA',
  card: '#FBF7EE',
  ink: '#17140F',
  dim: '#857D6E',
  h: '#5A9700',
  j: '#1F5EDB',
  m: '#E8432A',
  gray: '#8E877A',
};
export const NAMES = {h: '黄仁勋', j: '乔布斯', m: '我'};
