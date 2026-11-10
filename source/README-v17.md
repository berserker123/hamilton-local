# Hamilton Local v17 本地预览

仅预览，未部署，无 git push。在此目录运行：

```powershell
npm ci
npm run build
npm run preview
```

浏览器打开 http://127.0.0.1:4178 。默认首页保留动态列车窗，`?hero=window`、`?hero=a`、`?hero=b` 均可。

Windows 也可运行 `build.cmd`，shell 可运行 `sh build.sh`。三个入口调用同一个 `build.mjs`，继续使用 v16 的 esbuild + Tailwind 构建。新增 Leaflet 的 JS、CSS、图片和许可证均打包到 dist；只有地图瓦片需要联网。

```powershell
npm test
# 在另一个终端保持 npm run preview 运行后：
npm run qa
```

Playwright 使用用户现有浏览器 `F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe`。桌面1440×1000与手机390×1000截图写至 `../out/shots`，运行记录 `../out/qa-v17.json`。外链核验记录与最终中文总结见上一级目录。

新增照片授权：`public/photos/CREDITS-v17.md`；地图来源：`../out/research/playgrounds-sources.md`。照片与相关授权文件会随构建一起复制到 dist/photos。

更新范围：节庆独占分类；联系卡；12个真实游乐场交互地图与可筛选列表；中央图书馆CC照片，另两处缺图保持明确占位。数据核实日期为2026年11月11日；继承的其他商业信息核对日期未作修改。
