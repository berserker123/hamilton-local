# 群聊搞笑短视频项目：交接说明

> 最后更新：2026-11-26。第一版来自 2026-11-25 的网页对话，之后在 Claude Code 会话“搞笑视频引流”里继续做。
> 代码在仓库 `berserker123/hamilton-local` 的 `videos/group-chat/`，当前分支 `claude/dazzling-ritchie-5bds7m`，**还没合并到 `main`**。

## 1. 项目目标
- 给 **Hamilton Local** 账号做“模拟手机群聊”类搞笑短视频，用来涨粉，并引流到 hamiltonlocal.nz（中文 Hamilton 生活指南网站）。
- 视频定位是**获客工具**，不指望平台分成赚钱。
- 打法：**视频负责好玩，网站文章负责有用**。每条视频配一篇网站文章，视频结尾引导去看。

## 2. 当前进度一览

| 项目 | 状态 | 位置 |
|---|---|---|
| 样片 #1 英文版 “If NZ birds had a group chat” | ✅ 已完成，45.6 秒，带水印 | `scripts/nz_birds.json` |
| 样片 #1 中英双语版（发小红书） | ✅ 已完成，48.3 秒，有结尾引流卡片 | `scripts/nz_birds_zh.json` |
| 配套文章《在 Hamilton 想看 Tūī 和 Kererū，去这几个地方》 | ✅ 已写好，等合并上线 | 网站 `/talk/hamilton-tui-kereru-spots/` |
| 模板改成读取 JSON 剧本 | ✅ 已完成 | `make.py` + `scripts/README.md` |
| 水印 | ✅ 已支持，账号名待定 | JSON 里的 `watermark` 字段 |
| 中文原创版“华人家长群 vs Kiwi 家长群” | ⬜ 未开始 | — |
| 视频实际发布 | ⬜ 未发布 | — |

## 3. 目录结构
```
videos/group-chat/
├── HANDOFF.md          本文件
├── make.py             生成器（Python + Pillow 逐帧绘制，管道交给 ffmpeg 编码）
├── scripts/
│   ├── README.md       剧本 JSON 字段和节奏参数说明
│   ├── nz_birds.json   英文版剧本
│   └── nz_birds_zh.json 中英双语版剧本
└── out/                渲染结果和预览图（.gitignore，不进 git，需要时重新渲染）
```

## 4. 怎么用
```bash
cd videos/group-chat
python3 make.py scripts/nz_birds.json preview 5 20 40    # 导出预览帧到 out/，并打印总时长 END
python3 make.py scripts/nz_birds.json out/nz_birds.mp4   # 完整渲染，约 1 分钟
```
- **做新视频**：复制一个现有 JSON 改内容，先 preview 看 END（目标约 45 秒），再完整渲染。
- 每条台词：`["角色", "英文"]`，要加中文字幕就写 `["角色", "英文", "中文"]`；系统消息写成 `["sys", "文字"]`。
- 字段完整说明见 `scripts/README.md`。
- **依赖**：Python 3 + Pillow、ffmpeg、Inter 字体（`/usr/share/fonts/opentype/inter/`）、文泉驿正黑（`/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc`）。换环境时先确认这两个字体路径。

## 5. 已确定的规格和偏好
- 1080×1920 竖屏，30fps，H.264，**无声音**（发布时在 TikTok 或 Reels app 里加热门音乐）
- **时长 45 秒左右**（Frank 明确要求）。双语版因为要多读一行中文，放宽到 48 秒左右
- **节奏不能太快**：第一版 35 秒，Frank 反馈“对话跳得太快”。现在的默认节奏：
  - “正在输入”动画 0.8 秒
  - 每条消息停留 max(1.75 秒, 英文字数 / 16, 中文字数 / 7)
  - 系统消息 1.3 秒
  - 新消息弹出和聊天框滚动都有缓动，不是硬跳
- 版面：顶部紫色标题条 + 白色副标题条，下方是 WhatsApp 风格的聊天框
- 水印位置：副标题条下方的空隙，在各平台的安全区内（底部会被字幕和按钮挡住，所以不放底部）
- 水印内容：英文版 `hamiltonlocal.nz`；中文版 `Hamilton Local`，**不放网址**，因为小红书视频里出现网址容易被限流
- 中文字体只有文泉驿一种粗细，标题粗体是用描边模拟的。想更好看可以装思源黑体（Noto Sans CJK）后改 `CJK_FONT`

## 6. 样片 #1 的角色和梗（都基于新西兰鸟类的真实特点）
- Kiwi（群主，右侧绿色气泡）：自称国鸟，抱怨自己不会飞
- Tūī：会学舌，一直复读 Kiwi
- Seagull：只关心薯条，越问越急
- Pūkeko：爱横穿马路
- Kererū：吃了发酵浆果会醉
- Kea：拆游客的雨刮器
- Takahē：曾被认为已经灭绝，1948 年才被重新发现
- 结尾：Possum 进群，马上被 Kiwi 踢出。中文版注释为“新西兰头号公敌”

## 7. 配套文章（已写，未上线）
- 栏目：屯里二三事 → 生活小妙招。数据在 `source/src/data/river-talk.json`，`id` 为 `hamilton-tui-kereru-spots`
- 内容：Waiwhakareke 公园、Hamilton Zoo（kererū 展区）、Taitua Arboretum、Maungatautari 保护区（有 takahē，10 月到 1 月繁殖季可能限制参观）；Hamilton Halo 控鼠计划使 tūī 在 2004 到 2019 年间增加约 25 倍；kererū 冬末到春天常在树苜蓿和 kōwhai 上觅食
- 核对日期 2026-11-25，有效期至 2027-05-25，来源链接都写在文章里
- 需要知道的：
  - Taitua 有 kākā 只有一条网友观察记录，文中写的是“有人看到过”
  - 没写 Hamilton Gardens，因为找不到那里能看到 tūī 的可靠来源
- 网站改动规则见 `docs/DESIGN-RULES.md`（Frank 要求才合并和发布）。构建：`cd source && npm ci && node build.mjs`，测试：`npm test`（2026-11-25 跑过，139 项全部通过）

## 8. 选题库（同一个模板，换剧本即可）
- **新西兰动物/鸟**：Kiwi、Tūī、海鸥、Pūkeko、羊、负鼠（全国追杀）等，可以做 10 条以上
- **新西兰城市**：Auckland 炫房价、Wellington 风大、Hamilton 自嘲、Christchurch、Queenstown、Tauranga 晒海滩
- **新西兰日常物品**：Jandals、Pavlova、L&P、Marmite vs Vegemite（跟澳洲吵）
- **华人生活**（中文版，最适合引流）：华人家长群 vs Kiwi 家长群（“she'll be right”）、移民第一年 vs 第十年
- **节日热点**：夏天过圣诞、Matariki、全黑队比赛、下雨天、油价
- 做纯中文剧本时，台词直接写中文即可，不用第三项字幕。模板会自动按字换行、切换中文字体

## 9. 发布平台
- **英文版**（面向 Kiwi）：TikTok + Facebook Reels + Instagram Reels，同一条视频三个平台一起发
- **中文版或双语版**（面向华人）：小红书 + 视频号，最适合给 Hamilton Local 引流
- **本地 FB 群**（Hamilton 社区群）：偶尔发，先看群规，别太像广告
- 网站上暂时不用开视频专区，以后挑几条火的嵌进相关文章页面

## 10. 引流策略
- 英文视频的观众是 Kiwi，而网站是中文的。英文视频主要用来涨粉，真正引流要靠中文版或双语版
- 主页简介放 hamiltonlocal.nz（TikTok 新账号放链接可能有粉丝门槛，要在后台确认）
- 视频结尾用 `outro` 卡片放钩子，例如双语版的“Hamilton 哪里能看到 Tūī？地点整理好了 · 搜 Hamilton Local”
- Facebook：链接放在置顶评论里，或者另发一条普通帖子
- 小红书：不能放外链，在主页写“搜 Hamilton Local”，或者引导私信

## 11. 变现现实（2026-11 了解到的情况）
- TikTok Creator Rewards 只给超过 1 分钟的原创视频付钱，而且据了解新西兰可能不在开放国家里，45 秒视频不符合
- Facebook Content Monetization 要求本人和收款账户都在符合资格的国家，新西兰的具体资格要开通专业模式后在后台确认
- Instagram 基本没有普通创作者的播放分成
- **真正的变现路径**：
  1. 引流到网站 → 接本地商家广告
  2. 粉丝多了 → 本地华人商家（餐馆、地产、移民留学中介）找你做推广视频
  3. 帮小商家做同款视频，收服务费（符合一人 AI 公司的方向）

## 12. 待办 / 下一步
- [ ] **Frank 决定**：是否把分支合并到 `main`，让观鸟文章上线（视频发布前最好先上线，结尾的钩子才有着落）
- [ ] **Frank 决定**：账号名。确定后改各 JSON 的 `watermark`，重新渲染
- [ ] 发布样片 #1：英文版发 TikTok、FB Reels、IG Reels；双语版发小红书、视频号
- [ ] 做中文版“华人家长群 vs Kiwi 家长群”，结尾引流到网站的学校、生活信息，并配一篇对应文章
- [ ] 从选题库挑下一批剧本，目标每周 3 到 5 条，坚持 1 到 2 个月再评估效果（看涨粉数和网站访问量）
- [ ] 可选：装思源黑体，提升中文标题效果

## 13. 注意
- 网站通过 GitHub Pages 从 `main` 分支根目录发布。合并后 `videos/` 目录也能公开访问，包括这份交接文档（里面有变现思路和 Frank 的名字）。如果不想公开，合并前把 `videos/` 移出仓库，或者改成私有仓库存放
- `out/` 不进 git。需要成片时用第 4 节的命令重新渲染
