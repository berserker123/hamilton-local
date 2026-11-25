# 群聊搞笑短视频项目：交接说明

> 来源：2026-11-25 与 Claude 的对话整理。给 Claude Code 统一管理用。

## 1. 项目目标
- 给 **Hamilton Local** 账号做"模拟手机群聊"类搞笑短视频，用来涨粉，并引流到 hamiltonlocal.nz（中文 Hamilton 生活指南网站）。
- 视频定位是**获客工具**，不指望平台分成赚钱。

## 2. 参考视频
- Facebook Reel："IF ANIMALS HAD A GROUP CHAT / THIS MADE MY DAY"（账号 KROMA - retro phone）
  - 链接：https://www.facebook.com/share/v/1HgmoaTufA/
  - 形式：竖屏，模拟聊天界面，动物逐条发消息互怼，无真人出镜
  - 数据（2026-11-25 查看）：约 2 万赞、118 评论、1,675 分享

## 3. 已完成：样片 #1 "If NZ birds had a group chat"
- 文件：`nz_birds_group_chat_45s.mp4`（最终版，约 45 秒）
- 规格：1080×1920 竖屏，30fps，H.264，**无声音**，**无账号水印**
- 生成脚本：`make.py`（Python + Pillow，逐帧绘制后通过管道交给 ffmpeg 编码）
- 角色和梗（均基于真实的新西兰鸟类特点）：
  - Kiwi（群主，消息显示在右侧绿色气泡）：自称国鸟，抱怨不会飞
  - Tūī：会学舌，一直复读 Kiwi
  - Seagull：只关心薯条，越问越急
  - Pūkeko：爱横穿马路
  - Kererū：吃发酵浆果会醉
  - Kea：拆游客的雨刮器
  - Takahē：曾被认为灭绝，1948 年才被重新发现
  - 结尾：Possum 进群，马上被 Kiwi 踢出

## 4. 已确定的规格和偏好
- **时长控制在 45 秒左右**（Frank 明确要求）
- **节奏不能太快**：第一版 35 秒，Frank 反馈"对话跳得太快"。现在的参数：
  - "正在输入"动画：0.8 秒
  - 每条消息停留：max(1.75 秒, 字数 / 16)
  - 系统消息：1.3 秒
  - 新消息弹出和聊天框滚动都有缓动，不是硬跳
- 顶部固定：紫色标题条 + 白色副标题条（"TAG A KIWI WHO NEEDS THIS"）
- 背景音乐不在视频里，发布时在 TikTok 或 Reels app 里加热门音乐

## 5. make.py 用法（2026-11-25 已改为读取 JSON 剧本）
```bash
python3 make.py scripts/nz_birds.json preview 5 20 40    # 预览帧输出到 out/，并打印总时长 END
python3 make.py scripts/nz_birds.json out/nz_birds.mp4   # 完整渲染
```
- 剧本都放在 `scripts/`，格式说明见 `scripts/README.md`
- 现有剧本：`nz_birds.json`（英文原版，45.6 秒）、`nz_birds_zh.json`（中英双语字幕版，发小红书，48.3 秒，结尾有引流卡片）
- 支持：中文字幕（每条消息第三项）、水印（`watermark`）、结尾引流卡片（`outro`）、节奏参数（`timing`）
- `out/` 里是渲染结果，不进 git

## 6. 选题库（同一个模板，换剧本即可）
- **新西兰动物/鸟**：Kiwi、Tūī、海鸥、Pūkeko、羊、负鼠（全国追杀）等，可以做 10 条以上
- **新西兰城市**：Auckland 炫房价、Wellington 风大、Hamilton 自嘲、Christchurch、Queenstown、Tauranga 晒海滩
- **新西兰日常物品**：Jandals、Pavlova、L&P、Marmite vs Vegemite（跟澳洲吵）
- **华人生活**（中文版，最适合引流）：华人家长群 vs Kiwi 家长群（"she'll be right"）、移民第一年 vs 第十年
- **节日热点**：夏天过圣诞、Matariki、全黑队比赛、下雨天、油价

## 7. 发布平台
- **英文版**（面向 Kiwi）：TikTok + Facebook Reels + Instagram Reels，同一条视频三个平台一起发
- **中文版**（面向华人）：小红书 + 视频号，最适合给 Hamilton Local 引流
- **本地 FB 群**（Hamilton 社区群）：偶尔发，先看群规，别太像广告
- 网站上暂时不用开视频专区，以后挑几条火的嵌进相关文章页面

## 8. 变现现实（2026-11 了解到的情况）
- TikTok Creator Rewards 只给超过 1 分钟的原创视频付钱，而且据了解新西兰可能不在开放国家里，45 秒视频不符合
- Facebook Content Monetization 要求本人和收款账户都在符合资格的国家。新西兰的具体资格，开通专业模式后在后台确认
- Instagram 基本没有普通创作者的播放分成
- **真正的变现路径**：
  1. 引流到网站 → 接本地商家广告
  2. 粉丝多了 → 本地华人商家（餐馆、地产、移民留学中介）找你做推广视频
  3. 帮小商家做同款视频，收服务费（符合一人 AI 公司的方向）

## 9. 引流策略
- **关键问题**：英文视频的观众是 Kiwi，而网站是中文的。英文视频主要用来涨粉，真正引流要靠中文版或中文字幕版
- 主页简介放 hamiltonlocal.nz（TikTok 新账号放链接可能有粉丝门槛，要在后台确认）
- 视频结尾加钩子，例如"Hamilton 观鸟地点整理好了，看主页链接"
- **每条视频配一篇网站文章**：视频负责好玩，文章负责有用。例如鸟类视频配《Hamilton 附近哪里能看到 Tūī 和 Kererū》
- Facebook：链接放在置顶评论里，或者另发一条普通帖子
- 小红书：不能放外链，在主页写"搜 Hamilton Local"，或者引导私信

## 10. 待办 / 下一步
- [x] 水印：已支持 `watermark` 字段。英文版暂用 `hamiltonlocal.nz`，中文版用 `Hamilton Local`（小红书视频里出现网址容易被限流）。Frank 确认账号名后改 JSON 即可
- [ ] 做中文版，例如"华人家长群 vs Kiwi 家长群"，结尾引流到网站的学校、生活信息
- [x] 鸟类视频中文字幕版：`scripts/nz_birds_zh.json`，结尾卡片写“地点整理好了 · 搜 Hamilton Local”
- [x] 观鸟文章：屯里二三事 → 生活小妙招《在 Hamilton 想看 Tūī 和 Kererū，去这几个地方》，地址 `/talk/hamilton-tui-kereru-spots/`
- [x] 模板改成读取外部 JSON 剧本
- [ ] 目标更新频率：每周 3 到 5 条，坚持 1 到 2 个月再评估效果
