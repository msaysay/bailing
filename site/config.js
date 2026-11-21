// 站点配置：上线前改这里。页面上的品牌名、社群入口、下载链接、算账的默认数字都从这里取。
window.SITE = {
  brand: '宁少 AI 进化论',
  // 社群入口：填二维码图片路径（放 assets/img/ 下）和一句说明。没填二维码时页面显示文字说明。
  community: { qr: '', how: '抖音：进粉丝群　·　视频号：评论区留言「AI剪辑」', note: '社群里每天更新新模板，也可以按你的业务定制工作流' },
  // 免费包放在 site/downloads/ 下，由 scripts/release.py 打包并写出 downloads.js（文件名和大小）。社群包不放在站上。
  downloadBase: 'downloads/',
  // 「算账」的默认值和范围。都是估算，访客可以自己拖。出处见页面底部。
  calc: { videos: 20, salary: 10000, outsource: 300, ai: 800 },
};
