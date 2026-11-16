import math
from PIL import Image, ImageDraw, ImageFont

# Canvas setup
width, height = 1200, 450
scale = 2
img = Image.new("RGBA", (width * scale, height * scale), (255, 255, 255, 255))
draw = ImageDraw.Draw(img)

# Colors
forest_green = (31, 107, 62, 255)   # #1F6B3E
charcoal = (26, 26, 24, 255)        # #1A1A18
white = (255, 255, 255, 255)

# Center of leaf emblem
cx, cy = 200 * scale, 225 * scale

# Draw clean organic leaf polygon with rounded bezier-approximated curve
# Tilted leaf points relative to center
leaf_coords = [
    (-28, 36), (-34, 18), (-36, -12), (-18, -34), (-2, -54), (25, -52),
    (38, -45), (38, -15), (26, 18), (-4, 34), (-16, 40), (-24, 38)
]

# Scale and offset points
scaled_points = [(cx + x * 2.2 * scale, cy + y * 2.2 * scale) for x, y in leaf_coords]
draw.polygon(scaled_points, fill=forest_green)

# Draw interior leaf vein in white
vein_pts = [
    (cx - 24 * 2.2 * scale, cy + 32 * 2.2 * scale),
    (cx - 10 * 2.2 * scale, cy + 12 * 2.2 * scale),
    (cx + 6 * 2.2 * scale, cy - 8 * 2.2 * scale),
    (cx + 28 * 2.2 * scale, cy - 38 * 2.2 * scale)
]
for i in range(len(vein_pts) - 1):
    draw.line([vein_pts[i], vein_pts[i+1]], fill=white, width=int(3 * scale))

# Side veins
side_vein_1 = [
    (cx - 4 * 2.2 * scale, cy + 14 * 2.2 * scale),
    (cx + 16 * 2.2 * scale, cy + 7 * 2.2 * scale)
]
side_vein_2 = [
    (cx + 6 * 2.2 * scale, cy - 4 * 2.2 * scale),
    (cx + 24 * 2.2 * scale, cy - 11 * 2.2 * scale)
]
draw.line(side_vein_1, fill=white, width=int(2.2 * scale))
draw.line(side_vein_2, fill=white, width=int(2.2 * scale))

# Typography: Load Windows serif fonts
font_paths = [
    r"C:\Windows\Fonts\georgiab.ttf",
    r"C:\Windows\Fonts\georgia.ttf",
    r"C:\Windows\Fonts\timesbd.ttf",
    r"C:\Windows\Fonts\cambriab.ttf",
]

font = None
for fp in font_paths:
    try:
        font = ImageFont.truetype(fp, size=int(135 * scale))
        break
    except Exception:
        continue

if not font:
    font = ImageFont.load_default()

text_x = 360 * scale
text_y = 150 * scale
draw.text((text_x, text_y), "El Niño", font=font, fill=charcoal)

# Downsample for crisp anti-aliasing
final_img = img.resize((width, height), Image.Resampling.LANCZOS)
final_img.save(r"C:\Users\hp\Desktop\el-nino\public\logo.png", "PNG")
print("Saved green leaf logo.png")

# Also render square logo-mark.png (512x512)
icon_size = 512
icon_scale = 2
icon_img = Image.new("RGBA", (icon_size * icon_scale, icon_size * icon_scale), (255, 255, 255, 255))
icon_draw = ImageDraw.Draw(icon_img)
icx, icy = (icon_size * icon_scale) // 2, (icon_size * icon_scale) // 2

icon_scaled_points = [(icx + x * 4.2 * icon_scale, icy + y * 4.2 * icon_scale) for x, y in leaf_coords]
icon_draw.polygon(icon_scaled_points, fill=forest_green)

icon_vein_pts = [
    (icx - 24 * 4.2 * icon_scale, icy + 32 * 4.2 * icon_scale),
    (icx - 10 * 4.2 * icon_scale, icy + 12 * 4.2 * icon_scale),
    (icx + 6 * 4.2 * icon_scale, icy - 8 * 4.2 * icon_scale),
    (icx + 28 * 4.2 * icon_scale, icy - 38 * 4.2 * icon_scale)
]
for i in range(len(icon_vein_pts) - 1):
    icon_draw.line([icon_vein_pts[i], icon_vein_pts[i+1]], fill=white, width=int(5 * icon_scale))

icon_side_1 = [
    (icx - 4 * 4.2 * icon_scale, icy + 14 * 4.2 * icon_scale),
    (icx + 16 * 4.2 * icon_scale, icy + 7 * 4.2 * icon_scale)
]
icon_side_2 = [
    (icx + 6 * 4.2 * icon_scale, icy - 4 * 4.2 * icon_scale),
    (icx + 24 * 4.2 * icon_scale, icy - 11 * 4.2 * icon_scale)
]
icon_draw.line(icon_side_1, fill=white, width=int(3.5 * icon_scale))
icon_draw.line(icon_side_2, fill=white, width=int(3.5 * icon_scale))

final_icon = icon_img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
final_icon.save(r"C:\Users\hp\Desktop\el-nino\public\logo-mark.png", "PNG")
print("Saved green leaf logo-mark.png")
