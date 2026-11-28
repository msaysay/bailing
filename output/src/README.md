# 手势特效组件库

渲染链：`track.py`（MediaPipe 手部追踪 → track.json）→ `fx.py`（基础层）→ `fx2.py`（空中界面系统）→ `fx3.py`（v3 新组件）→ `mix*.py`（音效混音）。
`fx3.py` 通过 exec 复用 `fx2.py`，`fx2.py` 复用 `fx.py`。用法：`python3 fx3.py <工作目录> full`，或传逗号分隔的帧号只出预览帧。

## 组件清单

| 类别 | 组件 | 函数 | 文件 |
|---|---|---|---|
| 手部 | 骨骼线 / 指尖准星 / 手势识别标签 | `hand_hud` `gesture` | fx2 |
| 手部 | 指尖能量拖尾、粒子 | `trail` `emit` | fx / fx2 |
| 手部 | 掌心法阵、双手闪电、全息球、测距弧 | `magic` `lightning` `sphere` `caliper` | fx |
| 手机 | 绿幕替换界面、环绕图标轨道 | `phone` | fx2 |
| 手机 | 通知卡片堆叠 | `notifications` | fx3 |
| 界面 | 玻璃磁贴（悬停 / 点击 / 翻页 / 收回） | `draw_tiles` `tile_sprite` | fx2 |
| 界面 | Dock、滑杆、系统日志 | `dock` `slider` | fx2 |
| 界面 | 搜索栏打字 + 结果卡片、聊天气泡 | `search` `bubbles` `card` | fx3 |
| 界面 | 捏合携带的数据块、投屏缩略图 | `orbs` `carry` | fx2 |
| 界面 | 放大全息屏、双手巨幕 | `zoom_holo` `bigscreen` | fx |
| 场景 | 显示器描边 / 扫描线、物体定位框、点击涟漪 | `monitor_hud` `books_hud` `ripple` | fx / fx2 |
| 文字 | 霓虹发光书法字（点亮闪烁 + 呼吸） | `neon_text` | fx3 |
| 画面 | 取景框（REC / 时间码） | `viewfinder` | fx3 |
| 画面 | 黑白世界 → 彩色从手机扩散 | `color_wave` | fx3 |
| 画面 | 屏幕光打在场景上 | `screen_light` | fx3 |
| 画面 | 局部马赛克转场、RGB 错位故障 | `pixelate` `glitch` | fx3 |
