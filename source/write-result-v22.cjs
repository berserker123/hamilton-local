const fs=require('fs');const scenes=require('../out/research/scenes-v22.json'),qa=require('../out/qa-v22.json'),videos=require('../out/video-verification-v22.json');
let md=`

# v22 本地预览结果（2026-11-11）

已完成本次五项修改，源代码位于 \`work/src\`，已重新构建 \`work/dist\`。预览保持运行：**http://127.0.0.1:4183/**。仅修改 v22 副本；未 git push，未发布，也未修改 LIVE v21。

## 本次改动

1. **首页火车窗外：共 11 景。** 保留原有 4 景，新增下表 7 张照片。每次拉绳等待下一张图片解码后换景；窗框不动，继续沿用既有横移与交叉淡化。新增可读的中英文地点标签。默认 window、显式 \`?hero=window\` 和 \`?hero=a/b\` 均保留。
2. **本地生活：冬季飘雪。** 细雨替换为六角雪花，大小不同，轻柔摆动和旋转，部分轻微模糊；桌面最多 22 片，手机显示 12 片。春花瓣、夏光斑、秋落叶与新西兰季节初始化保留。装饰层不拦截点击。
3. **亲子遛娃：今日小签。** 顶部原拉绳每次抽出一张纸票感卡片，轻落与微摆，显示类型、名称、一行简介及原有详情／地图入口。2026-11-11 的候选为 **12 个游乐场、7 个既有亲子地点、16 个明确标注 family_friendly 且日期未过的活动**；日期按新西兰时区动态筛选。洗牌袋逐项抽完再循环，跨循环也避免连续重复；活动过期会从候选中排除。没有编造场地、活动或说明。
4. **便民黄页：翻翻黄页。** 小黄页翻动三层纸页，约 950ms 后定位至随机分类；自动切换其所属标签，滚动并描边突出该分类。只使用原来的 **9 个分类**，仍如实显示“暂无商家”。
5. **实用工具箱：生活小锦囊。** 工具箱盖弹开，已有内容小提示滑出；**8 个候选**覆盖垃圾、公交、天气／UV、学期假期、学区、停水停电／道路、政府入口、油价／充电。按钮使用站内既有工具或原有链接，没有增加事实性建议。

三种卡片均一次只显示一张，快速连续拉动替换当前结果；支持关闭按钮、Esc、点外部关闭和键盘操作。关闭后恢复拉绳焦点，站内按钮将焦点移至对应内容。离开页面清理卡片、定时器和高亮。固定定位避免布局跳动，卡片外区域可继续操作。减少动态效果时新卡片只有 140ms 淡入，不翻页、不摆动、不移动；首页与季节继续使用原有静态／标识反馈。

## 七张新增照片与许可

全部通过 Wikimedia Commons 原图元数据核对作者、许可、尺寸与地点，并目视检查原图及窗口效果。原图宽度 **3840–5472px**。窗外衍生图为 **2400×675 WebP**：16:9 主体裁剪、轻微暖色与低饱和处理，尾部镜像拼接供既有轨道循环。衍生文件沿用各自原许可；原有照片文件全部未改。

| 地点／画面 | 作者 | 免费许可 | 原图尺寸／出处 |
|---|---|---|---|
`;
for(const r of scenes)md+=`| ${r.zh} | ${r.author} | [${r.license}](${r.licenseUrl}) | [${r.width}×${r.height}](${r.source}) |\n`;
md+=`
完整作者、许可、原图 URL、修改说明及原图／衍生图 SHA256 已记录于 [licenses/window-scenes.md](licenses/window-scenes.md)，同时复制进 \`work/public/licenses\` 与 \`work/dist/licenses\`。站点“图片来源与授权”弹窗逐张显示 7 张新图的署名、许可链接、来源链接及修改说明。元数据与原图保存在 [out/research](out/research)。Hamilton lake.jpg 的经纬度为 −37.798180, 175.278992，确认为 Waikato 的 Lake Rotoroa；Commons 上混入的 Hamilton, New York 分类未作为地点依据。未选用许可不能明确确认的游船照片，也未使用地点不符的 Wairere Falls 图片。

## 锁定项目核对

相对 [v21 文件哈希基线](out/baseline-v21.json)，**全部原有照片、JSON 数据、内容模块与 PullCord.tsx 保持原样**；Motion.tsx 也逐字节恢复为 v21。已有文件仅修改 App.tsx、PageExperience.tsx、experience-model.ts、page-experience.css 和窗景许可文件。

- 深色主题、名称与医疗“急诊”措辞、slogan、Hamilton Gardens 原图、所有栏目 teaser 照片保持。
- 六家超市顺序及六个“看街景”按钮、区域分组、footer 邮箱保持。
- Playground 地图仍为 12 处；派对场地展开后仍为 118 条；首页快捷标签仍为 5 个，原有好去处卡片与数据保持。
- 拉绳仍在导航右侧，原有组件、48px 阈值、触控捕获、键盘与无障碍说明保持。

## QA 结果

环境：Chromium **${qa.browser}**，Playwright **1.61.1**；桌面 **1440×1000**，手机 **390×844**，另验证短横屏 **844×300**。Browser 插件未提供，按要求使用本地 Playwright 与现有 Chromium。

| 检查 | 结果 |
|---|---|
| npm run build | 通过，dist 更新 |
| npm test | **12/12 通过**，包括所有既有测试及新增抽签／11 景循环测试 |
| PREVIEW_URL=http://127.0.0.1:4183 node qa-cord-status.cjs | 通过，既有跨栏目读屏状态回归 |
| node qa-v22.cjs | **${qa.checks.length} 组通过** |
| 全页面与子标签桌面／手机 | **${qa.routes.length} 个状态**，标题与主内容正确，无空白页、错误层、横向溢出 |
| 拉绳／卡片 | 拖动阈值、取消、单次触发、Enter／空格、X／Esc／外部点击、焦点恢复、快速连续抽取、跨标签跳转通过 |
| 手机／短横屏 | 卡片与关闭按钮在屏内，内容可滚动；触摸拉绳不滚动页面，页面本身可滚动 |
| reduced motion | 仅淡入新卡片，动画与位移停用；原有静态窗景／季节反馈保留 |
| 全部本地构建资源 | **${qa.assets.length} 项 HTTP 200** |
| 控制台错误／页面异常／HTTP 错误／失败请求 | **0 / 0 / 0 / 0**；**0 个 404** |
| 独立审查 | 已修复并复核：垃圾工具按钮焦点、短横屏定位、黄页翻页后再滚动；无未解决的具体问题 |
| 五段 WebM | 全部完整解码，抽帧目视检查通过 |

证据：[QA 明细](out/qa-v22.json)、[审查与复核](out/review-v22.md)、[视频验证](out/video-verification-v22.json)、[视频联系图](out/video-checks-v22/contact-sheet.jpg)。

本副本初始复制漏掉依赖的 out 子目录及旧测试研究 fixture；已从 v21 原样补齐缺失文件，未升级依赖或改动业务数据。

## 截图与短视频

全部位于 **out\\shots**。

- 首页七张新增场景：[1 花园](out/shots/home-new-scene-1.png)、[2 怀卡托河](out/shots/home-new-scene-2.png)、[3 Fairfield](out/shots/home-new-scene-3.png)、[4 Claudelands](out/shots/home-new-scene-4.png)、[5 博物馆](out/shots/home-new-scene-5.png)、[6 热气球夜光](out/shots/home-new-scene-6.png)、[7 汉密尔顿湖](out/shots/home-new-scene-7.png)。
- 飘雪：[桌面](out/shots/living-winter-snow-desktop.png)、[手机](out/shots/living-winter-snow-mobile.png)。
- 亲子抽签：[桌面](out/shots/kids-draw-desktop.png)、[手机](out/shots/kids-draw-mobile.png)。
- 黄页：[翻页中](out/shots/directory-flip-riffle.png)、[定位分类](out/shots/directory-flip-desktop.png)。
- 工具箱：[开盖中](out/shots/toolbox-tip-opening.png)、[小提示](out/shots/toolbox-tip-desktop.png)。

| 视频 | 时长 | 内容 |
|---|---:|---|
`;
const descriptions={'home-train':'真实拉绳，展示全部 7 张新景，窗框固定','living-winter-snow':'拉绳切到冬季，雪花飘落','kids-draw':'连续 3 次真实拉绳，3 个不同结果','directory-flip':'黄页纸页翻动，再滚动并突出分类','toolbox-tip':'工具箱开盖，小提示滑出'};
for(const v of videos)md+=`| [${v.name}.webm](out/shots/${v.name}.webm) | ${v.duration.toFixed(2)} 秒 | ${descriptions[v.name]} |\n`;
md+=`
均为 1440×1000 VP8 WebM。复跑录像：\`node capture-v22.cjs\`；验证录像：\`node verify-videos-v22.cjs\`。

## 待确认事项／验证边界

- 本次无未完成需求或阻碍预览的问题。没有使用无明确免费许可的新图片。
- 既有设计素材缺少作者许可记录的历史问题维持 v21 原状；本次 7 张新图全部提供明确免费许可。旧窗景亦按要求保留。
- 活动信息只取站内已有记录并按日期筛选，没有重新核实主办方临时变更；过期记录自动不参与抽签。
- 地图底图继续依赖 OpenStreetMap。未做实体手机、Safari／Firefox 或真人读屏器验收。
- 构建仅保留原有 Browserslist 数据过旧提示，构建成功，未更新依赖。

预览复跑：在 work 中设置 \`$env:PORT='4183'\` 后运行 \`node preview.cjs\`。当前服务保持运行。
`;
fs.appendFileSync('../RESULT.md',md,'utf8');console.log('Appended v22 Chinese result section');
