"""按全部稿子的用字给两款思源字体做子集，输出 public/fonts/{serif,sans}.woff2。
完整字体先下载到 ~/.cache/vibe-fonts（见 README）。"""
import os, sys
from fontTools import subset
home = os.path.expanduser('~/.cache/vibe-fonts')
text = open('build/chars.txt', encoding='utf-8').read() + '▍●■'
for src, dst in [('NotoSerifSC.ttf', 'serif'), ('NotoSansSC.ttf', 'sans')]:
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']
    f = subset.load_font(os.path.join(home, src), opts)
    s = subset.Subsetter(opts); s.populate(text=text); s.subset(f)
    out = f'public/fonts/{dst}.woff2'; subset.save_font(f, out, opts)
    print(out, os.path.getsize(out) // 1024, 'KB')
