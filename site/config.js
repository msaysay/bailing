// 站点配置：上线前改这里。品牌名、知识星球、培训、算账的默认数字都从这里取。
window.SITE = {
  brand: '宁少 AI 进化论',
  // 知识星球。涨价了就改 price；满员后的价格改 next；limit 是涨价的人数线。
  community: { name: 'AI获客工坊', platform: '知识星球', qr: 'assets/img/zsxq-qr.png', price: 980, next: 2980, limit: 100,
    how: '微信扫码，加入知识星球「AI获客工坊」', note: '按人数涨价：前 100 人 ¥980，满 100 人后 ¥2980，之后继续随人数上调。早进早划算。' },
  // 线下培训。date、place、seats 定了再填，空着就显示「进星球看最新一期」。
  training: { name: 'AI 内容工作流培训', form: '线下小班 · 两天一夜', price: 6980, was: 9800, date: '', place: '', seats: '', pay: '报名需先付款锁定名额' },
  downloadBase: 'downloads/',
  // 「算账」的默认值。都是估算，访客可以自己拖。出处见页面底部。
  calc: { videos: 20, salary: 10000, outsource: 300, ai: 800 },
};
