// 每张卡的示例参数：卡片总览（YueduCards）用它出图，写 edl.json 时照着这个结构填。
export const SAMPLES: { name: string; use: string; props: Record<string, unknown> }[] = [
  { name: 'Formula', use: '口播在说「A 加 B 加 C」组成一套东西', props: { kicker: '交付系统', title: '把非标服务做成标准产品', parts: ['双师模式', '标准化培训', '数字化诊断'], result: '可复制的交付系统' } },
  { name: 'BigNumber', use: '口播里出现一个撑得起画面的数字', props: { kicker: '全国门店', title: '同一套标准，复制到每一家', value: 600, suffix: '+', unit: '家门店', label: '高质量标准化复制' } },
  { name: 'Compare', use: '传统做法和我们的做法对着讲', props: { kicker: '第一点 · 双师模式', title: '从依赖名师，到产品赋能', left: { name: '传统阅读机构', items: ['依赖教师个人素养', '教师一走质量就崩'] }, right: { name: '约读书房', items: ['教学过程标准化', '新老师也能达标交付'] } } },
  { name: 'Split', use: '两个角色各管什么（总部和门店、线上和线下）', props: { kicker: '双师模式', title: '总部出内容，门店做交付', left: { role: '总部', items: ['标准化课程内容', '教学话术', '读书会流程'] }, right: { role: '门店老师', items: ['本地化交付', '心理引导', '课堂氛围营造'] }, link: '教研产出' } },
  { name: 'Steps', use: '口播在讲第一步、第二步、第三步', props: { kicker: '第二点 · 三会进阶培训', title: '人才供给的标准化流水线', steps: [{ t: '线上学', s: '7 天线上集中培训' }, { t: '线下考', s: '7 天沉浸式实操' }, { t: '实地战', s: '真实门店跟岗实习' }] } },
  { name: 'Ladder', use: '一级比一级高的进阶路径', props: { kicker: '进阶培训体系', title: '从普通老师到阅读指导师', steps: [{ t: '线上学', s: '统一服务认知' }, { t: '线下考', s: '以考促学' }, { t: '实地战', s: '通过考核才能上岗' }] } },
  { name: 'Checklist', use: '并列的几条要点，一条条确认', props: { kicker: '智能化门店运营系统', title: '每家门店都能调用总部资源', items: [{ t: '最新教研资源', s: '总部统一更新' }, { t: '营销素材', s: '拿来即用' }, { t: '会员管理工具', s: '数据全程可查' }] } },
  { name: 'Report', use: '讲测评、能力维度、报告', props: { kicker: '阅读综合素养测评', title: '把抽象的阅读能力变成数据', badge: '20 到 30 分钟生成', dims: [{ name: '专注度', score: 86 }, { name: '语意解码速度', score: 78 }, { name: '逻辑推演能力', score: 82 }, { name: '信息提取', score: 74 }, { name: '表达输出', score: 69 }] } },
  { name: 'Curve', use: '讲增长、变化趋势，手里没有真实数值', props: { kicker: '量化增长曲线', title: '家长看得见的进步', series: ['专注度', '语意解码速度', '逻辑推演能力'] } },
  { name: 'Dashboard', use: '讲后台、监控、数据看板，录屏看不清或没有', props: { kicker: '总部后台', title: '每家门店的数据都在系统里', tiles: [{ k: '会员数据', v: '实时' }, { k: '测评数据', v: '逐店' }, { k: '续费转化率', v: '可追溯' }], rows: [{ name: '门店 A', v: 0.92 }, { name: '门店 B', v: 0.87 }, { name: '门店 C', v: 0.64, tag: '待指导' }, { name: '门店 D', v: 0.9 }] } },
  { name: 'Loop', use: '几个环节首尾相接成闭环', props: { kicker: '质量闭环', title: '测评、指导、再测评', nodes: ['测评', '报告', '指导', '复测'], center: '可追溯' } },
  { name: 'Quote', use: '一句结论当画面', props: { kicker: '我们交付的', text: '不是课程时长，而是一套经过验证的阅读教育商业解决方案', mark: '经过验证' } },
  { name: 'Magnify', use: '有后台录屏或截图，但字太小看不清', props: { kicker: '总部后台', title: '逐店查看测评与教学成效', src: 'yuedu-demo/clips/backend.jpg', focus: [0.02, 0.2, 0.96, 0.36], rows: [['测评转化', '逐店可查'], ['教学成效', '逐店可查'], ['远程指导', '按数据下发']] } },
];
