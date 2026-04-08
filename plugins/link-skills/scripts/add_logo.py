#!/usr/bin/env python3
"""
Add fivebucks.ai logo overlay to generated images.
Usage: python3 add_logo.py <input_image> <output_image> [position] [scale]
  position: top-right (default), top-left, bottom-right, bottom-left
  scale: logo size as fraction of image width, e.g. 0.25 (default)

Note: logo PNG has transparent padding — always crop to content bbox first
so that top and right gaps are visually equal (both = 3% of image width).
"""

import sys
import os
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_BRAND = "fivebucks"


def get_logo_path(brand=DEFAULT_BRAND):
    return os.path.join(SCRIPT_DIR, "..", "brands", brand, "logo.png")
DEFAULT_SCALE = 0.18   # logo = 18% of image width
DEFAULT_MARGIN = 0.03  # margin = 3% of image width (applied to both x and y for equal gaps)


def add_logo(input_path, output_path, position="top-right", scale=DEFAULT_SCALE, brand=DEFAULT_BRAND):
    img = Image.open(input_path).convert("RGBA")
    logo = Image.open(get_logo_path(brand)).convert("RGBA")

    # Crop logo to actual content bounds — removes transparent padding
    # so visual gaps are truly equal (logo PNG has ~144px transparent top/bottom padding)
    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)

    img_w, img_h = img.size
    margin = int(img_w * DEFAULT_MARGIN)

    # Resize logo proportionally
    logo_w = int(img_w * scale)
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)

    # Position
    if position == "bottom-right":
        x = img_w - logo_w - margin
        y = img_h - logo_h - margin
    elif position == "bottom-left":
        x = margin
        y = img_h - logo_h - margin
    elif position == "top-right":
        x = img_w - logo_w - margin
        y = margin
    elif position == "top-left":
        x = margin
        y = margin
    else:
        x = img_w - logo_w - margin
        y = img_h - logo_h - margin

    # Composite
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    overlay.paste(logo, (x, y), logo)
    result = Image.alpha_composite(img, overlay).convert("RGB")
    result.save(output_path, "PNG")
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 add_logo.py <input> <output> [position] [scale]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    position = sys.argv[3] if len(sys.argv) > 3 else "top-right"
    scale = float(sys.argv[4]) if len(sys.argv) > 4 else DEFAULT_SCALE
    brand = sys.argv[5] if len(sys.argv) > 5 else DEFAULT_BRAND

    add_logo(input_path, output_path, position, scale, brand)
