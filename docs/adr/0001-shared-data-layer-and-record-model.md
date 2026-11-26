---
status: accepted
---

# 数据独立于前端，记录模型统一为 Place / Event / Tool

网站即将正式发布，之后还要复用为手机 App。现状是各板块数据以不同形状编进前端包：改一个电话号码就要重新构建，App 也只能复制一份。我们决定把数据抽成独立的、有 schema 的数据文件，作为唯一数据源，网站和 App 读同一份；上线前不引入后端或 CMS，发布产物仍是静态文件。

## 记录模型

- 所有内容只有四类 Record：**Place**（地点）、**Event**（活动）、**Tool**（工具）、**Deal**（限时优惠）。不存在通用的 "Listing"。便民黄页是服务类 Place 的视图，不单独建模。
- stays、upick、party-venues、pets、advisors 都是 Place，各有自己的 Category；pay-scales 是 Tool 的底层数据，不单独成 Record；图片及其署名附属于所属 Record。
- Deal 必须带结束日期和 Verification date，活动结束后整批归档，不进长期数据。
- Event 和商场内的店铺通过 **Venue** 引用 Place，不重复写地址。
- 每条 Record 有永久稳定的 **Record ID**：英文小写 kebab-case，全站唯一（跨四类），不带板块前缀，同品牌多分店用分店名而非序号区分；每年重复的 Event 在 ID 里带年份。改名或下架后不复用，因为收藏、深链接和 URL 都依赖它。
- 所有面向读者的文字统一用 `{zh, en}` 双语结构；`en` 可缺失，由界面回退到中文。淘汰 `hoursEn`、`areaEn`、`title_zh`、`title_en` 这类并列字段，以及中文到英文的反查表。
- 地区分两级固定名单：**Suburb**（Hamilton 市内）和 **Town**（Hamilton 以外）。`'Te Rapa · The Base'` 这类复合值拆成 `suburb: te-rapa` 加 `venue: the-base`（The Base 本身是一条 Place），读者端由前端拼出显示文字；跨区值按地址只填一个主 Suburb。名单先由现有记录统计出初稿、经人工定稿，作为独立数据文件维护，构建时遇到名单之外的值即失败。
- **Category** 是每个 Section 的固定名单，一条 Record 只属于一个。**Tag** 是自由短语，以 `{zh, en}` 成对存放，不使用平行数组，且程序逻辑不得依赖 Tag。
- **Source** 统一为带类型（official / directory / map 等）的列表，淘汰 `source` / `url` / `source_url` 并存的写法。
- 每条 Record 自带 **Verification date** 和 **Verification status**，取代文件级的 `CHECKED` 常量。`stale` 由日期推算（超过 90 天），不手填，不为营业时间或价格单设更短阈值。

## Considered Options

- **继续把数据编进前端包**：改动最小，但 App 必须复制数据，两边会漂移。
- **上线前就引入后端或 CMS**：更新方便，但对一个人维护的静态站来说，运维和成本不成比例。
- **每个板块保持自己的数据形状，只在 App 里做适配**：把不一致推给每个使用方，字段命名的分歧会永远留着。

## Consequences

- 现有约 20 个数据文件需要迁移到统一形状，迁移期间前端要有适配层。
- Record ID 一旦发布就不能改，所以命名规则必须在迁移前定好。
- 地区名单的具体内容、各板块 Category 名单需要在迁移时定稿。
