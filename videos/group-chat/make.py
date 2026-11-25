"""Group-chat video generator.

Usage:
  python3 make.py scripts/nz_birds.json preview 5 20 40   # preview frames + total length
  python3 make.py scripts/nz_birds.json out/nz_birds.mp4  # full render

Everything about an episode (title, cast, lines, timing, watermark, outro)
lives in the JSON script. See scripts/README.md for the format.
"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
LATIN_DIR = "/usr/share/fonts/opentype/inter/"
CJK_FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"

_cache = {}
def F(weight, size, cjk=False):
    key = (weight, size, cjk)
    if key not in _cache:
        _cache[key] = ImageFont.truetype(CJK_FONT, size) if cjk else ImageFont.truetype(LATIN_DIR + f"Inter-{weight}.otf", size)
    return _cache[key]

def is_cjk(ch):
    o = ord(ch)
    return 0x2E80 <= o <= 0x9FFF or 0x3000 <= o <= 0x303F or 0xFF00 <= o <= 0xFFEF or 0xF900 <= o <= 0xFAFF

class Text:
    """A font pair: Inter for Latin (keeps macrons like ū), WenQuanYi for Chinese."""
    def __init__(self, weight, size):
        self.lat, self.cjk = F(weight, size), F(weight, size, cjk=True)
        self.size = size
        # WenQuanYi has one weight: fake bold with a thin stroke.
        self.stroke = {"Bold": 2, "SemiBold": 1}.get(weight, 0)
    def runs(self, s):
        out = []
        for ch in s:
            c = is_cjk(ch)
            if out and out[-1][0] == c: out[-1][1] += ch
            else: out.append([c, ch])
        return out
    def length(self, s):
        return sum((self.cjk if c else self.lat).getlength(r) for c, r in self.runs(s))
    def draw(self, d, xy, s, fill, anchor="la"):
        x, y = xy
        w = self.length(s)
        if anchor[0] == "m": x -= w / 2
        elif anchor[0] == "r": x -= w
        va = anchor[1]
        for c, r in self.runs(s):
            f = self.cjk if c else self.lat
            sw = self.stroke if c else 0
            d.text((x, y), r, font=f, fill=fill, anchor="l" + va, stroke_width=sw, stroke_fill=fill if sw else None)
            x += f.getlength(r)

def tokens(text):
    """Latin words stay whole; each Chinese character can break."""
    out, cur = [], ""
    for ch in text:
        if is_cjk(ch):
            if cur: out.append(cur); cur = ""
            out.append(ch)
        elif ch == " ":
            if cur: out.append(cur); cur = ""
            out.append(" ")
        else:
            cur += ch
    if cur: out.append(cur)
    return out

def wrap(text, font, maxw):
    lines, cur = [], ""
    for tk in tokens(text):
        t = cur + tk
        if font.length(t.strip()) <= maxw or not cur.strip():
            cur = t
        elif tk in "，。！？、：；）」』”" and len(tk) == 1:
            cur = t  # never start a line with closing punctuation
        else:
            lines.append(cur.strip()); cur = tk.lstrip()
    if cur.strip(): lines.append(cur.strip())
    return lines or [""]

def rgb(c):
    if isinstance(c, str):
        c = c.lstrip("#"); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
    return tuple(c)

# ---------------------------------------------------------------- load script
if len(sys.argv) < 3:
    print(__doc__); sys.exit(1)
CFG = json.load(open(sys.argv[1], encoding="utf-8"))
CAST = {k: (rgb(v["avatar"]), rgb(v["name"])) for k, v in CFG["cast"].items()}
ME = CFG.get("me")
LINES = []
for row in CFG["script"]:
    if isinstance(row, dict): LINES.append((row["who"], row["text"], row.get("zh")))
    else: LINES.append((row[0], row[1], row[2] if len(row) > 2 else None))
for who, _, _ in LINES:
    if who != "sys" and who not in CAST: sys.exit(f"Unknown character in script: {who}")
TM = {"start": 0.9, "typing": 0.8, "min_hold": 1.75, "cps": 16, "zh_cps": 7, "sys_hold": 1.3, "end_hold": 1.5}
TM.update(CFG.get("timing", {}))

title_f = Text("Bold", CFG.get("title_size", 72)); strip_f = Text("Bold", CFG.get("strip_size", 54))
name_f = Text("SemiBold", 30); msg_f = Text("Regular", 40); zh_f = Text("Regular", 34); sys_f = Text("Medium", 30)
hdr_f = Text("SemiBold", 40); sub_f = Text("Regular", 28); av_f = Text("Bold", 40); wm_f = Text("SemiBold", 30)
out_f = Text("Bold", 54); out2_f = Text("SemiBold", 40)

def avatar(name, size=84):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((0, 0, size - 1, size - 1), fill=CAST[name][0] + (255,))
    av_f.draw(d, (size / 2, size / 2), name[0], "white", "mm")
    return im

# chat panel geometry
PX, PY, PW, PH = 40, 560, 1000, 1240
HEAD_H = 120; INPUT_H = 110
AREA_TOP = PY + HEAD_H; AREA_BOT = PY + PH - INPUT_H
MAXB = 640; PAD = 26; GAP = 22
GREEN = (217, 253, 211, 255); WHITE = (255, 255, 255, 255)

def bubble(kind, text, zh):
    if kind == "sys":
        lines = [text] + ([zh] if zh else [])
        tw = int(max(sys_f.length(l) for l in lines)) + 50
        hh = 52 + 40 * (len(lines) - 1)
        im = Image.new("RGBA", (PW, hh + 12), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        x0 = (PW - tw) // 2
        d.rounded_rectangle((x0, 6, x0 + tw, 6 + hh), 26, fill=(225, 218, 205, 255))
        for i, l in enumerate(lines):
            sys_f.draw(d, (PW / 2, 32 + 40 * i), l, (90, 85, 75), "mm")
        return im
    mine = kind == ME
    inner = MAXB - 2 * PAD
    lines = wrap(text, msg_f, inner)
    zlines = wrap(zh, zh_f, inner) if zh else []
    lh, zlh, nameh = 52, 46, 42
    tw = max([msg_f.length(l) for l in lines] + [zh_f.length(l) for l in zlines] + [name_f.length(kind)])
    bw = int(tw) + 2 * PAD
    bh = nameh + len(lines) * lh + (10 + len(zlines) * zlh if zlines else 0) + 2 * PAD - 8
    im = Image.new("RGBA", (PW, bh + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if mine:
        x0 = PW - 30 - bw; fill = GREEN
    else:
        x0 = 130; fill = WHITE
        im.alpha_composite(avatar(kind), (30, 0))
    d.rounded_rectangle((x0, 0, x0 + bw, bh), 28, fill=fill)
    y = PAD - 6
    name_f.draw(d, (x0 + PAD, y), kind, CAST[kind][1]); y += nameh
    for l in lines:
        msg_f.draw(d, (x0 + PAD, y), l, (20, 20, 20)); y += lh
    if zlines:
        y += 10
        for l in zlines:
            zh_f.draw(d, (x0 + PAD, y), l, (80, 80, 80)); y += zlh
    return im

def typing_img(kind, phase):
    im = Image.new("RGBA", (PW, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if kind == ME:
        x0 = PW - 30 - 150; fill = GREEN
    else:
        x0 = 130; fill = WHITE
        im.alpha_composite(avatar(kind), (30, 0))
    d.rounded_rectangle((x0, 0, x0 + 150, 84), 28, fill=fill)
    for i in range(3):
        a = 0.5 + 0.5 * math.sin(phase * 2 * math.pi - i * 0.9)
        c = int(200 - 110 * a); cy = 42 - 6 * a
        d.ellipse((x0 + 38 + i * 32 - 10, cy - 10, x0 + 38 + i * 32 + 10, cy + 10), fill=(c, c, c))
    return im

bubbles = [bubble(k, t, z) for k, t, z in LINES]

# ---------------------------------------------------------------- timeline
events = []  # (kind, t_typing_start, t_show)
t = TM["start"]
for k, txt, zh in LINES:
    if k == "sys":
        events.append((k, None, t)); t += TM["sys_hold"] + (len(zh) / TM["zh_cps"] * 0.5 if zh else 0)
    else:
        typ = TM["typing"]
        events.append((k, t, t + typ))
        hold = max(TM["min_hold"], len(txt) / TM["cps"], len(zh) / TM["zh_cps"] if zh else 0)
        t += typ + hold
CHAT_END = t
OUTRO = CFG.get("outro")
OUTRO_T = CHAT_END + 0.6
END = (OUTRO_T + OUTRO.get("hold", 3.0)) if OUTRO else CHAT_END + TM["end_hold"]

# ---------------------------------------------------------------- static background
bg = Image.new("RGBA", (W, H), (17, 17, 17, 255))
d = ImageDraw.Draw(bg)
d.rectangle((0, 0, W, 330), fill=rgb(CFG.get("title_bg", [70, 50, 110])))
tl = CFG["title"]
for i, l in enumerate(tl):
    title_f.draw(d, (W / 2, 166 + (i - (len(tl) - 1) / 2) * 92), l, "white", "mm")
d.rectangle((0, 330, W, 450), fill="white")
strip_f.draw(d, (W / 2, 390), CFG["strip"], "black", "mm")
if CFG.get("watermark"):
    wm_f.draw(d, (W / 2, 505), CFG["watermark"], (150, 150, 150), "mm")
# phone panel
d.rounded_rectangle((PX, PY, PX + PW, PY + PH), 40, fill=(236, 229, 221))
d.rounded_rectangle((PX, PY, PX + PW, PY + HEAD_H + 40), 40, fill=(7, 94, 84))
d.rectangle((PX, PY + HEAD_H - 2, PX + PW, PY + HEAD_H + 40), fill=(236, 229, 221))
d.rectangle((PX, PY + 40, PX + PW, PY + HEAD_H), fill=(7, 94, 84))
d.ellipse((PX + 30, PY + 20, PX + 110, PY + 100), fill=(255, 200, 60))
Text("Bold", 32).draw(d, (PX + 70, PY + 60), CFG.get("group_initials", "".join(w[0] for w in CFG["group"].split()[:2])), (7, 94, 84), "mm")
hdr_f.draw(d, (PX + 135, PY + 22), CFG["group"], "white")
members = CFG.get("members", ", ".join(CAST))
while sub_f.length(members) > PW - 170 and len(members) > 4:
    members = members[:-4].rstrip(", ") + "…"
sub_f.draw(d, (PX + 135, PY + 72), members, (200, 230, 225))
iy = PY + PH - INPUT_H + 18
d.rounded_rectangle((PX + 24, iy, PX + PW - 120, iy + 76), 38, fill="white")
sub_f.draw(d, (PX + 60, iy + 38), CFG.get("input_hint", "Type a message"), (150, 150, 150), "lm")
d.ellipse((PX + PW - 100, iy, PX + PW - 24, iy + 76), fill=(7, 94, 84))

def ease(x): x = max(0, min(1, x)); return 1 - (1 - x) ** 3

def outro_card():
    lines = OUTRO["lines"]
    im = Image.new("RGBA", (PW - 120, 120 + 80 * len(lines)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), 40, fill=rgb(CFG.get("title_bg", [70, 50, 110])) + (255,))
    for i, l in enumerate(lines):
        (out_f if i == 0 else out2_f).draw(d, (im.width / 2, 100 + 80 * i), l, "white" if i == 0 else (255, 220, 120), "mm")
    return im
OUTRO_IMG = outro_card() if OUTRO else None

def frame(tt):
    im = bg.copy()
    layer = Image.new("RGBA", (PW, 8000), (0, 0, 0, 0))
    y = 20; items = []; typing = None
    for i, (k, ts, tshow) in enumerate(events):
        if tt >= tshow:
            p = ease((tt - tshow) / 0.25)
            nxt_started = i + 1 < len(events) and (tt >= events[i + 1][2] or (events[i + 1][1] is not None and tt >= events[i + 1][1]))
            items.append((bubbles[i], int(y), p))
            y += (bubbles[i].height + GAP) * (1 if nxt_started else p)
        elif ts is not None and tt >= ts:
            typing = (k, y); y += (90 + GAP) * ease((tt - ts) / 0.25)
            break
        else:
            break
    content_h = y
    for b, by, p in items:
        if p < 1:
            s = 0.85 + 0.15 * p
            bw, bh = int(b.width * s), max(1, int(b.height * s))
            sb = b.resize((bw, bh))
            sb.putalpha(sb.getchannel("A").point(lambda v: int(v * p)))
            layer.alpha_composite(sb, ((b.width - bw) // 2, by + (b.height - bh)))
        else:
            layer.alpha_composite(b, (0, by))
    if typing:
        layer.alpha_composite(typing_img(typing[0], tt * 1.6), (0, typing[1]))
    area_h = AREA_BOT - AREA_TOP
    off = int(max(0, content_h - area_h + 10))
    im.alpha_composite(layer.crop((0, off, PW, off + area_h)), (PX, AREA_TOP))
    if OUTRO and tt >= OUTRO_T:
        p = ease((tt - OUTRO_T) / 0.4)
        shade = Image.new("RGBA", (PW, PH), (0, 0, 0, int(150 * p)))
        im.alpha_composite(shade, (PX, PY))
        card = OUTRO_IMG.copy(); card.putalpha(card.getchannel("A").point(lambda v: int(v * p)))
        im.alpha_composite(card, (PX + 60, int(PY + PH / 2 - card.height / 2 + 40 * (1 - p))))
    return im.convert("RGB")

if __name__ == "__main__":
    if sys.argv[2] == "preview":
        name = os.path.splitext(os.path.basename(sys.argv[1]))[0]
        os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
        for tt in [float(x) for x in sys.argv[3:]]:
            frame(tt).save(os.path.join(HERE, "out", f"prev_{name}_{tt}.png"))
        print("END", round(END, 2)); sys.exit()
    out = sys.argv[2]
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(int(END * FPS)):
        p.stdin.write(frame(f / FPS).tobytes())
    p.stdin.close(); sys.exit(p.wait())
