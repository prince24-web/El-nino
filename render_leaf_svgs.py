import os
import math
from PIL import Image, ImageDraw, ImageFont

out_dir = r"C:\Users\hp\Desktop\el-nino\public"
os.makedirs(out_dir, exist_ok=True)

# ── Color Palette ─────────────────────────────────────────────────────────────
forest_green = "#1F6B3E"    # Rich, deep nature green
emerald_green = "#2E8B57"   # Vibrant leaf green
leaf_accent = "#4CAF6E"     # Fresh sprout green
charcoal = "#1A1A18"        # Deep serif text black
white = "#FFFFFF"

# ── 1. Variant A: Signature Organic Leaf (Clean, Iconic, Single Leaf with Vein)
svg_variant_a = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 180" width="100%" height="100%" fill="none">
  <rect width="520" height="180" fill="{white}"/>
  <g transform="translate(68, 90)">
    <!-- Graceful tilted leaf silhouette -->
    <path d="M -28 36 C -34 18, -36 -12, -18 -34 C -2 -54, 25 -52, 38 -45 C 38 -15, 26 18, -4 34 C -16 40, -24 38, -28 36 Z" fill="{forest_green}"/>
    <!-- Elegant interior vein curve -->
    <path d="M -24 32 C -12 12, 4 -8, 28 -38" stroke="{white}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M -4 14 C 4 8, 12 10, 16 7" stroke="{white}" stroke-width="2" stroke-linecap="round"/>
    <path d="M 6 -4 C 14 -10, 20 -8, 24 -11" stroke="{white}" stroke-width="2" stroke-linecap="round"/>
  </g>
  <text x="145" y="112" font-family="'Georgia', 'Times New Roman', 'Baskerville', 'Merriweather', serif" font-size="58" font-weight="500" fill="{charcoal}" letter-spacing="-0.5">El Niño</text>
</svg>"""

with open(os.path.join(out_dir, "logo.svg"), "w", encoding="utf-8") as f:
    f.write(svg_variant_a)

with open(os.path.join(out_dir, "logo-leaf-single.svg"), "w", encoding="utf-8") as f:
    f.write(svg_variant_a)

# ── 2. Variant B: Twin Sprouting Leaves (Growth, Resilience, Emergence)
svg_variant_b = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 180" width="100%" height="100%" fill="none">
  <rect width="520" height="180" fill="{white}"/>
  <g transform="translate(68, 90)">
    <!-- Main primary leaf -->
    <path d="M -15 36 C -18 15, -12 -18, 8 -38 C 22 -52, 40 -48, 44 -38 C 42 -10, 24 18, -2 34 C -8 37, -13 36, -15 36 Z" fill="{forest_green}"/>
    <!-- Secondary shoot leaf -->
    <path d="M -22 36 C -34 22, -38 2, -30 -14 C -22 -26, -6 -24, 0 -18 C -2 0, -8 20, -18 34 C -20 36, -21 36, -22 36 Z" fill="{emerald_green}" opacity="0.9"/>
    <!-- Organic curved stem -->
    <path d="M -20 40 C -16 32, -14 26, -12 20" stroke="{forest_green}" stroke-width="3" stroke-linecap="round"/>
  </g>
  <text x="145" y="112" font-family="'Georgia', 'Times New Roman', 'Baskerville', 'Merriweather', serif" font-size="58" font-weight="500" fill="{charcoal}" letter-spacing="-0.5">El Niño</text>
</svg>"""

with open(os.path.join(out_dir, "logo-leaf-twin.svg"), "w", encoding="utf-8") as f:
    f.write(svg_variant_b)

# ── 3. Variant C: Radial Botanical Leaf Cluster (The Leaf-Starburst / Claude homage in green)
svg_variant_c = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 180" width="100%" height="100%" fill="none">
  <rect width="520" height="180" fill="{white}"/>
  <g transform="translate(68, 90)">
    <!-- 8 organic leaf petals radiating like a natural agricultural sunburst -->
    <!-- Top leaf -->
    <path d="M 0 -8 C -6 -20, -6 -36, 0 -46 C 6 -36, 6 -20, 0 -8 Z" fill="{forest_green}"/>
    <!-- Top-right leaf -->
    <path d="M 6 -6 C 8 -22, 22 -30, 32 -32 C 26 -20, 18 -10, 6 -6 Z" fill="{forest_green}"/>
    <!-- Right leaf -->
    <path d="M 8 0 C 22 -4, 36 -2, 45 4 C 34 8, 20 6, 8 0 Z" fill="{forest_green}"/>
    <!-- Bottom-right leaf -->
    <path d="M 6 6 C 18 12, 26 24, 28 35 C 16 30, 10 18, 6 6 Z" fill="{forest_green}"/>
    <!-- Bottom leaf -->
    <path d="M 0 8 C 6 20, 6 36, 0 45 C -6 36, -6 20, 0 8 Z" fill="{forest_green}"/>
    <!-- Bottom-left leaf -->
    <path d="M -6 6 C -18 12, -26 24, -30 34 C -22 24, -14 14, -6 6 Z" fill="{forest_green}"/>
    <!-- Left leaf -->
    <path d="M -8 0 C -22 6, -36 4, -45 -2 C -34 -6, -20 -4, -8 0 Z" fill="{forest_green}"/>
    <!-- Top-left leaf -->
    <path d="M -6 -6 C -18 -12, -26 -24, -30 -33 C -20 -24, -12 -14, -6 -6 Z" fill="{forest_green}"/>
  </g>
  <text x="145" y="112" font-family="'Georgia', 'Times New Roman', 'Baskerville', 'Merriweather', serif" font-size="58" font-weight="500" fill="{charcoal}" letter-spacing="-0.5">El Niño</text>
</svg>"""

with open(os.path.join(out_dir, "logo-leaf-radial.svg"), "w", encoding="utf-8") as f:
    f.write(svg_variant_c)

# ── 4. Standalone Icon Marks (Favicons / App Badges) ───────────────────────────
svg_icon_a = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="none">
  <g transform="translate(60, 60) scale(1.15)">
    <path d="M -28 36 C -34 18, -36 -12, -18 -34 C -2 -54, 25 -52, 38 -45 C 38 -15, 26 18, -4 34 C -16 40, -24 38, -28 36 Z" fill="{forest_green}"/>
    <path d="M -24 32 C -12 12, 4 -8, 28 -38" stroke="{white}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M -4 14 C 4 8, 12 10, 16 7" stroke="{white}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M 6 -4 C 14 -10, 20 -8, 24 -11" stroke="{white}" stroke-width="2.2" stroke-linecap="round"/>
  </g>
</svg>"""

with open(os.path.join(out_dir, "logo-mark.svg"), "w", encoding="utf-8") as f:
    f.write(svg_icon_a)

print("Generated all leaf SVGs successfully.")
