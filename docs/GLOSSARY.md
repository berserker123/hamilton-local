# Hamilton Local

面向汉密尔顿（新西兰）华人居民的中英双语本地生活指南：整理已核验的地点、活动与日常工具，每条信息都附来源。

## 内容板块 Section

**Section（板块）**:
站点顶层的五个内容入口：实用工具箱（Tools）、本地生活（Living）、周末活动（What's on）、亲子遛娃（Kids）、便民黄页（Services）。
_Avoid_: 频道, 栏目, 模块, 页面

**Record（记录）**:
站点收录的一条独立信息，是 Place、Event、Tool、Deal 四者之一。
_Avoid_: 条目, 卡片, listing, item

**Record ID（记录标识）**:
一条 Record 永久不变的名字，英文小写、全站唯一，不带板块前缀；同品牌多分店用分店名区分。改名或下架后也不会被另一条 Record 复用。
_Avoid_: slug, key

## 记录类型

**Place（地点）**:
有固定地址、可以前往的 Record，如超市、游乐场、泳池、服务商、民宿、采摘园。
_Avoid_: 商家, 店铺, venue（venue 另有含义）

**Event（活动）**:
发生在特定日期的 Record，如集市、展览、周末活动。
_Avoid_: 节目, 场次

**Tool（工具）**:
没有地理位置、帮读者算数或做决定的 Record，如计算器、清单、说明文。
_Avoid_: 小工具, widget, 功能

**Deal（优惠）**:
有结束日期的限时商品价格，如 Black Friday 折扣，必须带结束日期和 Verification date。活动结束后整批归档，不进长期数据。
_Avoid_: 折扣, 促销, offer, sale

**Venue（场地）**:
一个 Event 举办所在的 Place，或一个 Place 所在的大型建筑群（如 The Base 商场）。Event 引用 Venue，不重复写地址。
_Avoid_: 地点（指 Place 时）, location

**黄页（Services directory）**:
便民黄页板块，由服务类 Category 的 Place 组成，不是独立的记录类型。
_Avoid_: 商家目录, yellow pages

## 地区

**Suburb（城区）**:
Hamilton 市内的一个区，如 Frankton、Rototuna、Hamilton East。取值来自固定名单，每个 Place 只有一个。
_Avoid_: 区域, area, 地区, 片区

**Town（城镇）**:
Hamilton 以外的 Waikato 地区城镇，如 Cambridge、Raglan、Te Awamutu。取值同样来自固定名单。
_Avoid_: 外地, 郊区, region

## 分类

**Category（分类）**:
每个 Section 自己的固定分类名单；一条 Record 只属于一个，用于导航和筛选。
_Avoid_: 类型（与 Record 类型混淆）, type, kind

**Tag（标签）**:
一条 Record 上自由书写的简短描述语，帮读者一眼识别特点。不用于导航和筛选，不影响任何展示逻辑。
_Avoid_: 关键词, label, 属性

## 可信度

**Source（来源）**:
支撑一条 Record 的信息出处，如官网、目录站、地图页。每条 Record 至少有一个。
_Avoid_: 参考, 链接, reference

**Verification date（核验日期）**:
我们最后一次对照 Source 确认这条 Record 的日期，不是 Source 页面自己的更新日期。
_Avoid_: 更新时间, 修改时间, 核查日期, last updated

**Verification status（核验状态）**:
一条 Record 的可信程度：已核验（verified）、待确认（pending）、过期（stale）。
_Avoid_: 状态（含糊）

**Stale（过期）**:
Verification date 距今超过 90 天的 Record。由日期推算得出，不由人工标记。
_Avoid_: 过时, outdated, 失效

## 语言

**Bilingual text（双语文本）**:
一段同时带中文和英文的内容。英文可以缺失，缺失时读者看到中文。
_Avoid_: 翻译, i18n 字段

## 黄页入驻

**Submission（提交）**:
商家通过 Google 表单发来的一份新增或修改请求。审核通过并转成 Place 后才成为 Record。
_Avoid_: 申请, 入驻单, listing

**Hidden（已隐藏）**:
Stale 之后再过 30 天仍未重新核验的 Record，不在页面显示，数据保留，重新核验后恢复。由日期推算，不手填。
_Avoid_: 删除, 下线（指自动隐藏时）

**Machine-translated（机器翻译）**:
由 AI 补出的中文文本上的标记，商家确认后去掉。
_Avoid_: 自动翻译, AI 文本