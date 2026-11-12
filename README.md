# 汉密尔顿生活指南 · Hamilton Local

汉密尔顿生活实用信息：垃圾回收、亚洲超市、周末去处、就医与公交。条目附来源，出发前请以官网为准。

本站通过 GitHub Pages 从 `main` 分支的根目录发布：

https://berserker123.github.io/hamilton-local/

## 文件

- `index.html`、`app.js`、`app.css`、`favicon.svg`、`photos/`：构建好的静态站点，路径均为相对路径。当前视觉为「极繁拼贴 Scrapbook」。
- `source/`：源码，含 `src/`、`public/`、`index.html`、`build.sh`、`tailwind.config.js`。
- `.nojekyll`：让 GitHub Pages 按原样提供文件，不经过 Jekyll 处理。

照片来自 Wikimedia Commons，署名显示在网站上。资料核查日期：2026-11-03。

## 关注与订阅

小红书链接和邮件订阅地址只写在 `source/src/follow-config.mjs`。留空时按钮和表单不会出现，也不会假装订阅成功。填好后在 `source/` 运行 `npm run build`。邮件表单推荐 Buttondown：`https://buttondown.com/api/emails/embed-subscribe/你的用户名`，字段名是 `email`。
