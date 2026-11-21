# 官网 · AI 剪辑工作流

纯静态站，没有构建步骤。把 `site/` 整个目录放到任何静态托管上就能用（GitHub Pages、Cloudflare Pages、对象存储、自己的 nginx）。电脑和手机各一套排法。

## 本地预览
```bash
cd site && python3 -m http.server 8080
```

## 文件

| 文件 | 内容 | 怎么改 |
|---|---|---|
| `config.js` | 品牌名、社群入口（二维码、文字）、算账的默认数字 | **上线前改这里** |
| `index.html` `style.css` `app.js` | 页面、样式、动效。两条流程的步骤、六套风格、常见问题的文字在 `app.js` 上半截 | 直接改 |
| `downloads.js` | 下载清单（包名、说明、文件名、大小） | 不手改，跑 `python3 scripts/release.py` 重新生成 |
| `downloads/` | 四个免费包，官网的下载按钮指向这里 | 同上，由 release.py 拷进来 |
| `data.js` `wall.js` `assets/demos/` `assets/thumbs/` | 组件墙的数据和每个组件的缩略图、5 秒演示 | 沿用上一版官网的素材 |
| `assets/video/` `assets/img/` | 首屏成片、三种剪法、五套模板截图、封面 | 换片子就替换同名文件 |

`assets/video/`、`assets/img/` 和 `downloads/*.zip` 不进仓库（里面是出镜人的画面和打包产物）。部署时用完整的 `site/` 目录，或者先跑一遍 release.py 再补上视频。

## 上线前要确认
见 `dist/release/下载对照表.md` 末尾的四条。
