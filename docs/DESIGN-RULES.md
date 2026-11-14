# Hamilton Local design rules

Read this at the start of every round. These are locked. A round may change only what Frank asked for, and the visual check must show every other page unchanged.

Both day and night themes get every change. Do not merge or publish unless Frank asks.

## Navigation

Order is fixed: 首页, 实用工具, 本地生活, 周末活动, 亲子遛娃, 便民黄页.

English names: Home, Daily Essentials, Local Living, What's On, Kids & Family, Local Services.

The section is 实用工具, never 实用工具箱. English stays Daily Essentials.

## Titles

Chinese is line one. English is line two. Do not swap them.

## Colour and themes

Day is oatmeal canvas, basalt ink, and clay. Night is charcoal with a light ink. No glow, no neon, no text shadow used as a glow.

## Photos and type

Text never sits on the bare photograph. Titles, lists, and notes sit on a solid surface, or on a dark scrim that keeps the text readable. Section heroes may sit over the page photograph only with that scrim.

Page backgrounds run continuously from the header to the footer. No extra colour band between the content and the footer.

Footnotes, photo credits, and the “发现信息有误？告诉我们” link share the left edge and width of the cards above them.

A photo credit is one small line at the very bottom of the page, near the copyright, and the same credit stays in the credits dialog. Do not put a credit pill in the list.

Use only images whose author and licence are recorded. Do not invent attribution. If a requested photo has no free Hamilton original, use the closest free Hamilton photograph and say so.

## Sub-tab bars

Every section sub-tab bar uses one full-width rounded track. On a desktop the items are evenly distributed as equal columns. On a phone, a bar of up to three labels stays on one row inside the frame, with smaller type and padding. A longer bar, including the 遛娃好去处 category bar, wraps into evenly spaced rows inside the frame. No label is cut by the border. Each section keeps its own active-pill colour.

实用工具 order: 垃圾清运, 急诊信息, 市区公交, 税后收入, 新移民清单, GST计算, 单位换算, 季节提醒, 其他工具.

周末活动 has 活动日历 and 周末集市 only. Festival items live inside 活动日历. 活动日历 shows the full week, not Friday to Sunday only. English for that tab is Events Calendar.

## Status pills

免费 is honey yellow. 待确认, TBC, and TBA are dusty blue, including a 时间待确认 time label. Priced pills are clay. Closed or sold-out pills are the faded outline. 免费入场 is shown as 免费, and Free in English. Qualifiers such as 免费，需报名 stay as written.

## Header

The theme control reads 换个风格, with the sun or moon icon before the words, and matches the language pill. The language pill stays beside it. On phone widths both pills get smaller together so the logo and name still fit.

## Homepage gallery

Lake Karapiro is not in the carriage window. Waiwhakareke wetland is second to last. Hamilton Lake is last.

## Copy that must not drift

Council off-leash areas are 免牵引绳区域, never 放绳区.

商家入驻 placeholders come after the real listings.

## Checking a round

`node qa/visual-regression.mjs check` compares the running build with `qa/baseline/`. Anything outside the round’s intended pages has to be fixed before the round ends. Update the baseline only after Frank approves the round.

`node qa/visual-regression.mjs baseline` rewrites `qa/baseline/` from the current build. Do not run it mid-round.
