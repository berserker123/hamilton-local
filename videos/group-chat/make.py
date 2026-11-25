import subprocess, sys, math, os
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
FD = "/usr/share/fonts/opentype/inter/"
def F(w, s): return ImageFont.truetype(FD + f"Inter-{w}.otf", s)

title_f = F("Bold", 72); strip_f = F("Bold", 54)
name_f = F("SemiBold", 30); msg_f = F("Regular", 40); sys_f = F("Medium", 30)
hdr_f = F("SemiBold", 40); sub_f = F("Regular", 28); av_f = F("Bold", 40)

BIRDS = {
    "Kiwi":    ((120, 85, 50),  "#B0703A"),
    "Tūī":     ((40, 60, 90),   "#3A6FB0"),
    "Seagull": ((150, 150, 160),"#D2691E"),
    "Pūkeko":  ((40, 70, 150),  "#2E55C8"),
    "Kererū":  ((60, 130, 90),  "#2E8B57"),
    "Kea":     ((90, 120, 50),  "#6B8E23"),
    "Takahē":  ((50, 110, 140), "#1F7A8C"),
}
ME = "Kiwi"  # Kiwi's messages appear on the right (it's "our" phone)

SCRIPT = [
    ("sys", "Kiwi created the group \"Aotearoa Birds\""),
    ("Kiwi", "Morning all. Just a reminder I'm the national icon"),
    ("Tūī", "Morning all. Just a reminder I'm the national icon"),
    ("Kiwi", "Stop copying me"),
    ("Tūī", "Stop copying me"),
    ("Seagull", "anyone got chips"),
    ("Pūkeko", "Crossing State Highway 1 rn. Cars can wait"),
    ("Kererū", "ate some fermented berries. fell off a branch. 10/10 would recommend"),
    ("Kea", "Just took a tourist's windscreen wiper. Anyone need one?"),
    ("Kiwi", "Must be nice to fly"),
    ("Seagull", "anyone got chips??"),
    ("Takahē", "Sorry been offline. Was extinct till 1948"),
    ("Seagull", "CHIPS???"),
    ("sys", "Possum joined the group"),
    ("sys", "Kiwi removed Possum"),
]

def wrap(text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if font.getlength(t) <= maxw: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def avatar(name, size=84):
    col = BIRDS[name][0]
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((0, 0, size - 1, size - 1), fill=col + (255,))
    d.text((size / 2, size / 2), name[0], font=av_f, fill="white", anchor="mm")
    return im

# chat panel geometry
PX, PY, PW, PH = 40, 560, 1000, 1240
HEAD_H = 120; INPUT_H = 110
AREA_TOP = PY + HEAD_H; AREA_BOT = PY + PH - INPUT_H
MAXB = 640; PAD = 26; GAP = 22

def bubble(kind, text):
    if kind == "sys":
        tw = int(sys_f.getlength(text)) + 50
        im = Image.new("RGBA", (PW, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        x0 = (PW - tw) // 2
        d.rounded_rectangle((x0, 6, x0 + tw, 58), 26, fill=(225, 218, 205, 255))
        d.text((PW / 2, 32), text, font=sys_f, fill=(90, 85, 75), anchor="mm")
        return im
    mine = kind == ME
    lines = wrap(text, msg_f, MAXB - 2 * PAD)
    lh = 52
    tw = max(msg_f.getlength(l) for l in lines)
    tw = max(tw, name_f.getlength(kind))
    bw = int(tw) + 2 * PAD
    nameh = 42
    bh = nameh + len(lines) * lh + 2 * PAD - 8
    im = Image.new("RGBA", (PW, bh + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if mine:
        x0 = PW - 30 - bw; fill = (217, 253, 211, 255)
    else:
        x0 = 130; fill = (255, 255, 255, 255)
        im.alpha_composite(avatar(kind), (30, 0))
    d.rounded_rectangle((x0, 0, x0 + bw, bh), 28, fill=fill)
    y = PAD - 6
    d.text((x0 + PAD, y), kind, font=name_f, fill=BIRDS[kind][1]); y += nameh
    for l in lines:
        d.text((x0 + PAD, y), l, font=msg_f, fill=(20, 20, 20)); y += lh
    return im

def typing_img(kind, phase):
    im = Image.new("RGBA", (PW, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if kind == ME:
        x0 = PW - 30 - 150; fill = (217, 253, 211, 255)
    else:
        x0 = 130; fill = (255, 255, 255, 255)
        im.alpha_composite(avatar(kind), (30, 0))
    d.rounded_rectangle((x0, 0, x0 + 150, 84), 28, fill=fill)
    for i in range(3):
        a = 0.5 + 0.5 * math.sin(phase * 2 * math.pi - i * 0.9)
        c = int(200 - 110 * a)
        cy = 42 - 6 * a
        d.ellipse((x0 + 38 + i * 32 - 10, cy - 10, x0 + 38 + i * 32 + 10, cy + 10), fill=(c, c, c))
    return im

bubbles = [bubble(k, t) for k, t in SCRIPT]

# timeline
events = []  # (kind, t_typing_start, t_show)
t = 0.9
for k, txt in SCRIPT:
    if k == "sys":
        events.append((k, None, t)); t += 1.3
    else:
        typ = 0.8
        events.append((k, t, t + typ))
        t += typ + max(1.75, len(txt) / 16)
END = t + 1.5

# static background
bg = Image.new("RGBA", (W, H), (17, 17, 17, 255))
d = ImageDraw.Draw(bg)
d.rectangle((0, 0, W, 330), fill=(70, 50, 110))
for i, l in enumerate(["IF NZ BIRDS HAD", "A GROUP CHAT"]):
    d.text((W / 2, 120 + i * 92), l, font=title_f, fill="white", anchor="mm")
d.rectangle((0, 330, W, 450), fill="white")
d.text((W / 2, 390), "TAG A KIWI WHO NEEDS THIS", font=strip_f, fill="black", anchor="mm")
# phone panel
d.rounded_rectangle((PX, PY, PX + PW, PY + PH), 40, fill=(236, 229, 221))
d.rounded_rectangle((PX, PY, PX + PW, PY + HEAD_H + 40), 40, fill=(7, 94, 84))
d.rectangle((PX, PY + HEAD_H - 2, PX + PW, PY + HEAD_H + 40), fill=(236, 229, 221))
d.rectangle((PX, PY + 40, PX + PW, PY + HEAD_H), fill=(7, 94, 84))
d.ellipse((PX + 30, PY + 20, PX + 110, PY + 100), fill=(255, 200, 60))
d.text((PX + 70, PY + 60), "AB", font=F("Bold", 32), fill=(7, 94, 84), anchor="mm")
d.text((PX + 135, PY + 22), "Aotearoa Birds", font=hdr_f, fill="white")
d.text((PX + 135, PY + 72), "Kiwi, Tūī, Seagull, Pūkeko, Kererū, Kea, Takahē", font=sub_f, fill=(200, 230, 225))
# input bar
iy = PY + PH - INPUT_H + 18
d.rounded_rectangle((PX + 24, iy, PX + PW - 120, iy + 76), 38, fill="white")
d.text((PX + 60, iy + 38), "Type a message", font=sub_f, fill=(150, 150, 150), anchor="lm")
d.ellipse((PX + PW - 100, iy, PX + PW - 24, iy + 76), fill=(7, 94, 84))
# subtle footer handle placeholder centered
bg_rgb = bg

def ease(x): x = max(0, min(1, x)); return 1 - (1 - x) ** 3

def frame(tt):
    im = bg_rgb.copy()
    layer = Image.new("RGBA", (PW, 6000), (0, 0, 0, 0))
    y = 20; items = []
    typing = None
    for i, (k, ts, tshow) in enumerate(events):
        if tt >= tshow:
            p = ease((tt - tshow) / 0.25)
            items.append((bubbles[i], int(y), p)); y += (bubbles[i].height + GAP) * (p if i == len(events)-1 or tt < events[i+1][2] and (events[i+1][1] is None or tt < events[i+1][1]) else 1)
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
            a = sb.getchannel("A").point(lambda v: int(v * p)); sb.putalpha(a)
            layer.alpha_composite(sb, ((b.width - bw) // 2, by + (b.height - bh)))
        else:
            layer.alpha_composite(b, (0, by))
    if typing:
        layer.alpha_composite(typing_img(typing[0], tt * 1.6), (0, typing[1]))
    area_h = AREA_BOT - AREA_TOP
    off = int(max(0, content_h - area_h + 10))
    crop = layer.crop((0, off, PW, off + area_h))
    im.alpha_composite(crop, (PX, AREA_TOP))
    return im.convert("RGB")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        for tt in [float(x) for x in sys.argv[2:]]:
            frame(tt).save(os.path.join(os.path.dirname(os.path.abspath(__file__)), f"prev_{tt}.png"))
        print("END", END); sys.exit()
    out = sys.argv[1]
    n = int(END * FPS)
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for f in range(n):
        p.stdin.write(frame(f / FPS).tobytes())
    p.stdin.close(); sys.exit(p.wait())
