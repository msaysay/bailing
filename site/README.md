# 官网 · 宁少 AI 进化论

纯静态站，没有构建步骤。把 `site/` 整个目录放到任何静态托管上就能用（GitHub Pages、Cloudflare Pages、对象存储、自己的 nginx）。

## 本地预览
```bash
cd site && python3 -m http.server 8080
```

## 文件
| 文件 | 内容 | 怎么改 |
|---|---|---|
| `index.html` `style.css` `app.js` | 页面、样式、交互 | 直接改 |
| `config.js` | 首屏组件墙用哪些组件、作品列表 | 手改，上线前先核对 |
| `data.js` | 全部组件和 Skill 的资料 | 不手改，跑 `python3 site/tools/build_data.py` 重新生成 |
| `assets/demos/` `assets/thumbs/` | 每个组件 5 秒演示和缩略图 | 跑 `site/tools/build_media.py`（用法见脚本开头） |
| `assets/videos/` | 作品视频和封面 | 放进来，再在 `config.js` 的 `works` 里登记 |

## 上线前要确认
1. 页面上没有放仓库链接，观众通过视频评论区拿地址。
2. 作品视频里出现的新闻画面没有取得授权，放不放由你决定。
