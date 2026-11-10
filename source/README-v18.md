# Hamilton Local v18 本地预览

派对与场地目录新增 28 处：汉密尔顿14、剑桥4、蒂阿瓦穆图3、拉格伦2、其他怀卡托5。默认汉密尔顿，可按地区与类型组合筛选。沿用 v17 页面与功能，只在派对页增加内容。

```powershell
npm ci
npm test
npm run build
npm run preview
```

预览：http://127.0.0.1:4179/#/kids?tab=parties 。仅本机，未发布，无 git push。

保持预览进程运行，在另一个终端：

```powershell
npm run qa
node check-external-links.cjs
```

QA 使用 `F:/Bo/ms-playwright/chromium-1254/chrome-win64/chrome.exe`，截图在 `../out/shots`，机器记录在 `../out/qa-v18.json`。没有 Browser 插件，采用用户指定的本地 Playwright。

数据：`src/party-venues.json`；来源和逐字段证据：`../out/research/party-venues-sources.md`；中文交付说明：`../RESULT.md`。

所有价格为NZD，按项注明计价单位。未知信息不推断；Gallagher 官方门牌冲突已在列表注明。官网核实不保证临时营业、档期或年龄适配，预订前联系场地。
