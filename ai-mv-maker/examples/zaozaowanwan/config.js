// 《早早晚晚》的设置（示例项目）。换歌时复制 templates/project 新建，不要直接改这里。
const CONFIG = {
  song: 'song.mp3',            // 歌放在项目文件夹里，文件名写这里（示例项目不带歌，自己放一首同名的进来）
  start: 14.6,                 // MV 从原曲第几秒开始：第一句人声前 1–2 秒
  end: 231.6,                  // 原曲总时长（秒）
  title: '早早晚晚',            // 片名：片头片尾用大号毛笔字
  subtitle: '致每一个赶路的人', // 片头片名下面的一行小字（不要就写 ''）
  ending: ['早一点，晚一点', '都会到的'], // 片尾两句（不要片尾卡就写 null）
  bigLine: '早早晚晚',          // 以这几个字开头的歌词行，用大号毛笔字逐字砸出（一般是副歌标题句）
  styles: ['silhouette'],      // 用到的画风包（styles 文件夹里的名字）
  lyrics: { style: 'glow', size: 70 }, // 歌词样式：glow / karaoke / vertical / minimal
  snapToBeat: false,           // 场景切换自动对齐鼓点（新项目建议 true）
  cover: { t: 127.62, sub: '致每一个赶路的人' }, // 封面取第几秒的画面、封面副标题
};
