"""把 build/preview/<id>/*.jpg 拼成联系表 build/preview/<id>-sheet-N.jpg（每张 3×4）。"""
import sys, glob
from PIL import Image
for eid in sys.argv[1:]:
    fs = sorted(glob.glob(f'build/preview/{eid}/*.jpg'))
    per = 12
    for p in range(0, len(fs), per):
        ims = [Image.open(f) for f in fs[p:p + per]]
        w, h = ims[0].size
        sheet = Image.new('RGB', (w * 3 + 20, h * 4 + 30), (40, 40, 40))
        for i, im in enumerate(ims):
            sheet.paste(im, ((i % 3) * (w + 10), (i // 3) * (h + 10)))
        sheet.save(f'build/preview/{eid}-sheet-{p // per}.jpg', quality=85)
        print(f'build/preview/{eid}-sheet-{p // per}.jpg')
