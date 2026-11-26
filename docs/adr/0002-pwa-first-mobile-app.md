---
status: accepted
---

# 手机 App 先做 PWA，暂不上架商店，不重写原生

网站正式发布后，先把已有的 `pwa-install` 分支（manifest + service worker，尚未推送）合并，让读者"安装到主屏幕"。等数据层（见 ADR-0001）稳定后，再评估是否用 Capacitor 套壳复用同一份前端上架应用商店。

## Considered Options

- **React Native / 原生重写**：体验最好，但要维护两套界面代码，对一个人维护的站点成本过高。
- **直接上架商店**：需要先有稳定的数据与更新机制，否则 App 内的信息会和网站漂移。

## Consequences

- 前端界面必须继续保持 Web 技术栈，不引入只能在原生运行的依赖。
- 数据更新靠重新发布静态文件，App 不做离线缓存之外的同步逻辑。
