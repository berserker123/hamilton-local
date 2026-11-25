# 剧本格式

每条视频对应一个 JSON 文件。新做一条视频时，复制一个现有剧本改内容就行。

```bash
python3 make.py scripts/nz_birds.json preview 5 20 40   # 导出预览帧到 out/，并打印总时长 END
python3 make.py scripts/nz_birds.json out/nz_birds.mp4  # 完整渲染
```

## 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 紫色标题条，数组里每项是一行，建议 2 行 |
| `strip` | 是 | 白色副标题条，一行 |
| `group` | 是 | 群名 |
| `cast` | 是 | 角色表：`"名字": {"avatar": [R,G,B], "name": "#颜色"}`。`avatar` 是头像底色，`name` 是气泡里名字的颜色 |
| `script` | 是 | 对话。每项为 `["角色", "英文"]` 或 `["角色", "英文", "中文字幕"]`；系统消息写成 `["sys", "文字"]` |
| `me` | 否 | 哪个角色显示在右侧绿色气泡，相当于“我的手机” |
| `watermark` | 否 | 副标题条下方的小字水印，在各平台的安全区内 |
| `group_initials` | 否 | 群头像里的字母，默认取群名前两个单词的首字母 |
| `members` | 否 | 群名下方的成员列表，默认列出全部角色，太长会自动截断 |
| `input_hint` | 否 | 输入框里的提示文字，默认 `Type a message` |
| `title_bg` | 否 | 标题条和结尾卡片的颜色，默认紫色 `[70,50,110]` |
| `outro` | 否 | 结尾引流卡片：`{"lines": ["主标题", "副标题"], "hold": 3.0}` |
| `timing` | 否 | 节奏参数，见下表 |

## 节奏（timing）

| 参数 | 默认 | 说明 |
|---|---|---|
| `start` | 0.9 | 第一条消息出现前的秒数 |
| `typing` | 0.8 | “正在输入”动画时长 |
| `min_hold` | 1.75 | 每条消息最短停留 |
| `cps` | 16 | 英文阅读速度（字符/秒） |
| `zh_cps` | 7 | 中文阅读速度（字/秒），有中文字幕时按中英文里较慢的一个计算停留时间 |
| `sys_hold` | 1.3 | 系统消息停留 |
| `end_hold` | 1.5 | 没有结尾卡片时，最后一条消息后的停留 |

时长目标约 45 秒，太长就删台词或调大 `cps`/`zh_cps`。先用 preview 看 END 再渲染。

## 字体

英文用 Inter（`/usr/share/fonts/opentype/inter/`），中文自动换成文泉驿正黑（`/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc`）。中英文混排会逐字切换字体，Tūī、Kererū 这类长音符号能正常显示。换环境时要确认这两个字体路径。
