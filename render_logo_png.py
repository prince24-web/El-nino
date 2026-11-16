import math
from PIL import Image, ImageDraw, ImageFont

# Canvas configuration
width, height = 1200, 450
scale = 2  # Super-sample for crisp anti-aliasing
img = Image.new("RGBA", (width * scale, height * scale), (255, 255, 255, 255))
draw = ImageDraw.Draw(img)

# Center of the emblem
cx, cy = 200 * scale, 225 * scale

# Color definitions
terracotta = (217, 119, 87, 255)  # Warm organic terracotta (#D97757)
charcoal = (26, 26, 24, 255)       # Rich dark serif black (#1A1A18)

# Sunburst / Leaf-Ray angles and lengths (mimicking Claude's organic hand-crafted rhythm)
rays = [
    # (angle_deg, inner_r, outer_r, stroke_width)
    (270, 16, 96, 15),   # Top
    (292, 14, 88, 14),
    (312, 15, 92, 14.5),
    (335, 16, 95, 14),
    (0,   18, 98, 15),   # Right
    (22,  15, 90, 14),
    (45,  16, 94, 14.5),
    (68,  14, 87, 14),
    (90,  18, 97, 15),   # Bottom
    (115, 15, 89, 14),
    (138, 16, 93, 14.5),
    (160, 14, 86, 14),
    (180, 18, 96, 15),   # Left
    (205, 15, 91, 14),
    (228, 16, 94, 14.5),
    (250, 14, 87, 14),
]

for angle_deg, r_in, r_out, stroke in rays:
    rad = math.radians(angle_deg)
    # Start and end coordinates
    x0 = cx + (r_in * scale) * math.cos(rad)
    y0 = cy + (r_in * scale) * math.sin(rad)
    x1 = cx + (r_out * scale) * math.cos(rad)
    y1 = cy + (r_out * scale) * math.sin(rad)
    
    draw.line([(x0, y0), (x1, y1)], fill=terracotta, width=int(stroke * scale))
    # Draw rounded end-caps
    cap_r = (stroke * scale) / 2
    draw.ellipse([x0 - cap_r, y0 - cap_r, x0 + cap_r, y0 + cap_r], fill=terracotta)
    draw.ellipse([x1 - cap_r, y1 - cap_r, x1 + cap_r, y1 + cap_r], fill=terracotta)

# Typography: Try to load elegant serif fonts installed on Windows (Georgia, Times New Roman, Cambria)
font_paths = [
    r"C:\Windows\Fonts\georgiab.ttf",  # Georgia Bold
    r"C:\Windows\Fonts\georgia.ttf",   # Georgia Regular
    r"C:\Windows\Fonts\timesbd.ttf",   # Times New Roman Bold
    r"C:\Windows\Fonts\cambriab.ttf",  # Cambria Bold
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

# Text positioning
text_x = 360 * scale
text_y = 150 * scale

draw.text((text_x, text_y), "El Niño", font=font, fill=charcoal)

# Downsample for ultra-smooth anti-aliasing
final_img = img.resize((width, height), Image.Resampling.LANCZOS)
final_img.save(r"C:\Users\hp\Desktop\el-nino\public\logo.png", "PNG")
print("Saved high-res logo.png")

# Also generate a square app icon (512x512)
icon_size = 512
icon_scale = 2
icon_img = Image.new("RGBA", (icon_size * icon_scale, icon_size * icon_scale), (255, 255, 255, 255))
icon_draw = ImageDraw.Draw(icon_img)
icx, icy = (icon_size * icon_scale) // 2, (icon_size * icon_scale) // 2

for angle_deg, r_in, r_out, stroke in rays:
    rad = math.radians(angle_deg)
    # Scale up for 512 icon
    x0 = icx + (r_in * 2.2 * icon_scale) * math.cos(rad)
    y0 = icy + (r_in * 2.2 * icon_scale) * math.sin(rad)
    x1 = icx + (r_out * 2.2 * icon_scale) * math.cos(rad)
    y1 = icy + (r_out * 2.2 * icon_scale) * math.sin(rad)
    
    icon_draw.line([(x0, y0), (x1, y1)], fill=terracotta, width=int(stroke * 2.2 * icon_scale))
    cap_r = (stroke * 2.2 * icon_scale) / 2
    icon_draw.ellipse([x0 - cap_r, y0 - cap_r, x0 + cap_r, y0 + cap_r], fill=terracotta)
    icon_draw.ellipse([x1 - cap_r, y1 - cap_r, x1 + cap_r, y1 + cap_r], fill=terracotta)

final_icon = icon_img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
final_icon.save(r"C:\Users\hp\Desktop\el-nino\public\logo-mark.png", "PNG")
print("Saved high-res logo-mark.png")
