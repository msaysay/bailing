# 官网 · 宁少的 Skill 和 Agent 开源合集

纯静态站，没有构建步骤。把 `site/` 整个目录放到任何静态托管上就能用（GitHub Pages、Cloudflare Pages、对象存储、自己的 nginx）。

## 本地预览
```bash
cd site && python3 -m http.server 8080
```

## 文件
| 文件 | 内容 | 怎么改 |
|---|---|---|
| `index.html` `style.css` `app.js` | 页面、样式、交互 | 直接改 |
| `config.js` | 仓库地址、许可说明、首屏组件墙用哪些组件、作品列表、第三方代码表 | 手改，上线前先核对 |
| `data.js` | 181 个组件和 12 个 Skill 的资料 | 不手改，跑 `python3 site/tools/build_data.py` 重新生成 |
| `assets/demos/` `assets/thumbs/` | 每个组件 5 秒演示和缩略图 | 跑 `site/tools/build_media.py`（用法见脚本开头） |
| `assets/videos/` | 作品视频和封面 | 放进来，再在 `config.js` 的 `works` 里登记 |

## 上线前要确认
1. `config.js` 里的仓库地址已经对外公开。
2. 仓库根目录有 LICENSE 文件，并把 `config.js` 的 `ownLicense` 改成实际许可。
3. 作品视频里出现的新闻画面没有取得授权，放不放由你决定。
