import os, math
from PIL import Image, ImageDraw, ImageFont

W, H = 2100, 1500
OUT = '/sessions/pensive-sharp-bell/mnt/outputs/postcard-previews'
os.makedirs(OUT, exist_ok=True)

C = {
    'punk_red': (225, 58, 30),
    'cinema_bg': (15, 20, 30),
    'cinema_stripe1': (32, 38, 50),
    'cinema_stripe2': (40, 46, 58),
    'subtitle_yellow': (236, 205, 78),
    'paper_back': (244, 240, 230),
    'paper_front_fa': (250, 246, 236),
    'fashion_stripe1': (214, 186, 150),
    'fashion_stripe2': (222, 197, 164),
    'fashion_ink': (54, 42, 28),
    'fashion_edition': (78, 64, 46),
    'fashion_label': (80, 72, 62),
    'back_ink': (36, 33, 28),
    'back_address': (42, 40, 34),
    'back_rule': (135, 126, 113),
    'back_divider': (198, 191, 179),
    'back_stamp': (90, 82, 70),
    'hand_blue': (36, 40, 72),
    'white': (255, 255, 255),
    'black': (0, 0, 0),
}

def _font(names, size):
    tries = []
    for n in names:
        tries += [
            f'/usr/share/fonts/truetype/dejavu/{n}',
            f'/usr/share/fonts/truetype/liberation/{n}',
            n,
        ]
    for t in tries:
        try:
            return ImageFont.truetype(t, size)
        except Exception:
            continue
    return ImageFont.load_default()

F_BLACK = lambda s: _font(['DejaVuSans-Bold.ttf', 'LiberationSans-Bold.ttf'], s)
F_SERIF_I = lambda s: _font(['DejaVuSerif-BoldItalic.ttf', 'LiberationSerif-BoldItalic.ttf'], s)
F_MONO = lambda s: _font(['DejaVuSansMono.ttf', 'LiberationMono-Regular.ttf'], s)
F_HAND = lambda s: _font(['DejaVuSans-Oblique.ttf', 'DejaVuSerif-Italic.ttf'], s)

def _fill_stripes(img, bounds, angle, band, c1, c2):
    x, y, w, h = bounds
    # create big stripe image, rotate, then crop back onto bounds
    over = int(math.hypot(w, h)) + 400
    stripe = Image.new('RGB', (over * 2, over * 2), c2)
    sd = ImageDraw.Draw(stripe)
    i = 0
    while i < over * 2:
        sd.rectangle([0, i, over * 2, i + band], fill=c1)
        sd.rectangle([0, i + band, over * 2, i + band * 2], fill=c2)
        i += band * 2
    stripe = stripe.rotate(angle, resample=Image.BILINEAR)
    # crop center of rotated image to bounds size
    cx, cy = stripe.size[0] // 2, stripe.size[1] // 2
    crop = stripe.crop((cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2))
    img.paste(crop, (x, y))

def _wrap(draw, text, x, y, max_w, line_h, font, fill):
    words = text.split(' ')
    line = ''
    yy = y
    for w in words:
        test = (line + ' ' + w).strip()
        tw = draw.textlength(test, font=font)
        if tw > max_w and line:
            draw.text((x, yy), line, font=font, fill=fill)
            line = w
            yy += line_h
        else:
            line = test
    if line:
        draw.text((x, yy), line, font=font, fill=fill)
    return yy

def front_punk():
    img = Image.new('RGB', (W, H), C['black'])
    _fill_stripes(img, (0, 0, W, H), 45, 22, (17, 17, 17), (232, 232, 232))
    draw = ImageDraw.Draw(img)
    # SE1 stamp rotated
    stamp = Image.new('RGBA', (340, 140), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stamp)
    sd.rectangle([0, 0, 300, 110], fill=C['punk_red'])
    sd.text((30, 18), 'SE1\!\!', font=F_BLACK(72), fill=C['white'])
    stamp = stamp.rotate(3, resample=Image.BILINEAR, expand=True)
    img.paste(stamp, (100, 100), stamp)
    # title with red shadow
    tf = F_BLACK(220)
    for text, y in [('GREETINGS', 780), ('FROM', 980), ('WATERLOO', 1180)]:
        draw.text((120 + 14, y + 14), text, font=tf, fill=C['punk_red'])
        draw.text((120, y), text, font=tf, fill=C['white'])
    img.save(f'{OUT}/postcard-punk-front.png')

def front_cinema():
    img = Image.new('RGB', (W, H), C['cinema_bg'])
    _fill_stripes(img, (0, 0, W, H), 135, 20, C['cinema_stripe1'], C['cinema_stripe2'])
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 120], fill=C['black'])
    draw.rectangle([0, H - 120, W, H], fill=C['black'])
    draw.text((80, 160), 'SE1 · SCENE 05 · 17:19', font=F_MONO(40), fill=C['subtitle_yellow'])
    # subtitle box
    bx, by, bw, bh = W // 2 - 720, H - 300, 1440, 90
    overlay = Image.new('RGBA', (bw, bh), (0, 0, 0, 140))
    img.paste(overlay, (bx, by), overlay)
    draw = ImageDraw.Draw(img)
    line = '— The river is the only thing in London that tells the time.'
    f = F_MONO(40)
    tw = draw.textlength(line, font=f)
    draw.text((W // 2 - tw // 2, by + 22), line, font=f, fill=C['subtitle_yellow'])
    img.save(f'{OUT}/postcard-cinema-front.png')

def front_fashion():
    img = Image.new('RGB', (W, H), C['paper_front_fa'])
    _fill_stripes(img, (int(W * 0.4), 0, int(W * 0.6), H), 135, 22,
                  C['fashion_stripe1'], C['fashion_stripe2'])
    draw = ImageDraw.Draw(img)
    draw.text((100, 110), 'LONDON · SE1', font=F_MONO(30), fill=C['fashion_ink'])
    draw.text((100, H - 580), 'Waterloo', font=F_SERIF_I(180), fill=C['fashion_ink'])
    draw.text((100, H - 390), 'Bridge', font=F_SERIF_I(160), fill=C['fashion_ink'])
    draw.text((100, H - 180), 'ED. 01 / 05 OF 10', font=F_MONO(30), fill=C['fashion_edition'])
    chip = Image.new('RGBA', (560, 64), (255, 255, 255, 230))
    img.paste(chip, (W - 620, H - 130), chip)
    draw = ImageDraw.Draw(img)
    draw.text((W - 600, H - 118), 'BRIDGE · EAST · 17:19', font=F_MONO(24), fill=C['fashion_label'])
    img.save(f'{OUT}/postcard-fashion-front.png')

def back(mode):
    img = Image.new('RGB', (W, H), C['paper_back'])
    draw = ImageDraw.Draw(img)
    dx = int(W * 0.58)
    draw.line([(dx, 120), (dx, H - 120)], fill=C['back_divider'], width=2)
    msg = ("M — walked home across Waterloo last night. The river caught. "
           "Thought of you in Lisbon. Six minutes of gold, then nothing.")
    _wrap(draw, msg, 120, 180, int(W * 0.55 - 200), 90, F_HAND(62), C['hand_blue'])
    draw.text((120, H - 260), '— A.', font=F_HAND(62), fill=C['hand_blue'])
    x0 = dx + 80
    draw.text((x0, 180), 'LONDON CUTS · ED.01 / 05', font=F_MONO(28), fill=C['back_ink'])
    rows = ['Matteo Ricci', 'Rua das Flores 28', '1200-195 Lisboa', 'Portugal']
    for i, r in enumerate(rows):
        y = 280 + i * 80
        draw.text((x0, y), r, font=F_MONO(34), fill=C['back_address'])
        draw.line([(x0, y + 58), (W - 340, y + 58)], fill=C['back_rule'], width=2)
    # stamp box (dashed)
    sw, sh = 180, 230
    sx, sy = W - 260, H - 340
    dl, gl = 10, 8
    cx = sx
    while cx < sx + sw:
        draw.line([(cx, sy), (min(cx + dl, sx + sw), sy)], fill=C['back_stamp'], width=3)
        draw.line([(cx, sy + sh), (min(cx + dl, sx + sw), sy + sh)], fill=C['back_stamp'], width=3)
        cx += dl + gl
    cy = sy
    while cy < sy + sh:
        draw.line([(sx, cy), (sx, min(cy + dl, sy + sh))], fill=C['back_stamp'], width=3)
        draw.line([(sx + sw, cy), (sx + sw, min(cy + dl, sy + sh))], fill=C['back_stamp'], width=3)
        cy += dl + gl
    for i, l in enumerate(['1ST', 'CLASS', '—', 'SE1']):
        f = F_MONO(24)
        tw = draw.textlength(l, font=f)
        draw.text((sx + sw // 2 - tw // 2, sy + 60 + i * 38), l, font=f, fill=C['back_stamp'])
    img.save(f'{OUT}/postcard-{mode}-back.png')

front_punk(); front_cinema(); front_fashion()
for m in ('punk', 'fashion', 'cinema'):
    back(m)

# composite sheet
sw, sh = 3, 2
tw, th = 700, 500
pad = 20
sheet = Image.new('RGB', (tw * sw + pad * (sw + 1), th * sh + pad * (sh + 1) + 60), (18, 18, 20))
d = ImageDraw.Draw(sheet)
d.text((pad, 14), 'London Cuts · 6 postcard PNGs · 2100x1500 each (downscaled for preview)',
       font=F_MONO(28), fill=(200, 200, 200))
layout = [('punk-front', 0, 0), ('fashion-front', 1, 0), ('cinema-front', 2, 0),
          ('punk-back', 0, 1), ('fashion-back', 1, 1), ('cinema-back', 2, 1)]
for name, cx, cy in layout:
    im = Image.open(f'{OUT}/postcard-{name}.png').resize((tw, th), Image.LANCZOS)
    x = pad + cx * (tw + pad)
    y = 60 + pad + cy * (th + pad)
    sheet.paste(im, (x, y))
    d.text((x + 10, y + th - 32), name, font=F_MONO(22), fill=(240, 240, 240))
sheet.save(f'{OUT}/postcards-sheet.png')
print('done; files:')
for f in sorted(os.listdir(OUT)):
    print('  ', f, os.path.getsize(f'{OUT}/{f}'), 'bytes')
