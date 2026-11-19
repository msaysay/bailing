// 这首歌的设置。prep_audio.py build 跑完会提示 start 和 end 填多少。
const CONFIG = {
  song: 'song.mp3',            // 歌的文件名（放在这个文件夹里）
  start: 0,                    // MV 从原曲第几秒开始：第一句人声前 1–2 秒
  end: 180,                    // 原曲总时长（秒）
  title: '歌名',                // 片名：片头片尾用大号毛笔字（2–6 个字最好看）
  subtitle: '',                // 片名下面一行小字，比如「致每一个赶路的人」，不要就留空
  ending: null,                // 片尾卡两句话，例如 ['早一点，晚一点', '都会到的']；不要片尾卡就写 null
  bigLine: '',                 // 副歌标题句的开头几个字（比如「早早晚晚」），这一行会用大号毛笔字砸出来；没有就留空
  styles: ['silhouette'],      // 用到的画风包：silhouette 剪影插画 / neon 霓虹城市 / image-layers AI 生图
  lyrics: { style: 'glow', size: 70 }, // 歌词样式：glow 逐字发光 / karaoke 卡拉OK填色 / vertical 竖排毛笔 / minimal 小字
  snapToBeat: true,            // 场景切换自动对齐到最近的鼓点
  camera: 'push',              // 默认运镜：push 慢推 / pull 慢拉 / drift 漂移 / still 不动
  grade: null,                 // 全片调色，例如 ['#ffb070', .12]（暖）或 ['#4060ff', .1]（冷）
  letterbox: 0,                // 上下黑边高度（像素），电影感用 120–160，0 = 不要
  cover: { t: null, sub: '' }, // 封面取第几秒的画面（null = 自动）、封面副标题
};
