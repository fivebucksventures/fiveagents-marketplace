#!/usr/bin/env python3
"""
Add professional text overlay to social images using Inter font.
Usage: python3 add_text_overlay.py <input_image> <output_image> <headline> [subline] [target_w] [target_h] [text_align] [text_position]

  target_w / target_h: optional canvas resize (e.g. 1080 1920 for Reels/Story).
                       Image is scaled to fill the canvas and center-cropped.
                       Defaults to original image size.
  text_align:          "left" (default) or "center"
  text_position:       "bottom" (default) or "top"

Features:
- Bottom or top gradient scrim for readability
- Inter Bold headline, auto word-wrapped
- Inter Regular subline, auto word-wrapped
- Subtle drop shadow on all text
- All sizes scale proportionally to canvas width
"""

import sys
import os
import textwrap
from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_BRAND = "fivebucks"

def get_font_paths(brand=DEFAULT_BRAND):
    fonts_dir = os.path.join(SCRIPT_DIR, "..", "brands", brand, "fonts")
    B = brand.upper()
    bold_path = os.path.join(fonts_dir, os.environ[f"{B}_FONT_BOLD"])
    regular_path = os.path.join(fonts_dir, os.environ[f"{B}_FONT_REGULAR"])
    # Fallback to fivebucks fonts if brand fonts not found
    if not os.path.exists(bold_path):
        fallback_dir = os.path.join(SCRIPT_DIR, "..", "brands", DEFAULT_BRAND, "fonts")
        bold_path = os.path.join(fallback_dir, os.environ[f"{DEFAULT_BRAND.upper()}_FONT_BOLD"])
    if not os.path.exists(regular_path):
        fallback_dir = os.path.join(SCRIPT_DIR, "..", "brands", DEFAULT_BRAND, "fonts")
        regular_path = os.path.join(fallback_dir, os.environ[f"{DEFAULT_BRAND.upper()}_FONT_REGULAR"])
    return bold_path, regular_path

SCRIM_HEIGHT_FRAC  = 0.42   # gradient covers bottom 42% of image
TEXT_BOTTOM_MARGIN = 0.07   # text block bottom sits 7% from image bottom
LINE_GAP_FRAC      = 0.05   # gap between headline block and subline


def fit_to_canvas(img, target_w, target_h):
    """Scale to fill canvas then center-crop."""
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w, new_h = int(src_w * scale), int(src_h * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top  = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


def wrap_text(text, font, max_px_width):
    """Word-wrap text to fit within max_px_width pixels."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = (current + " " + word).strip()
        if font.getlength(test) <= max_px_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_shadowed_text(draw, pos, text, font, fill=(255, 255, 255), shadow_offset=2, shadow_opacity=130):
    x, y = pos
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0, 0, 0, shadow_opacity))
    draw.text((x, y), text, font=font, fill=fill)


def add_text_overlay(input_path, output_path, headline, subline=None, target_w=None, target_h=None, text_align="left", text_position="bottom", brand=DEFAULT_BRAND, subline_scale=0.030):
    img = Image.open(input_path).convert("RGBA")

    # Resize to canvas if requested
    if target_w and target_h:
        img = fit_to_canvas(img, target_w, target_h)

    img_w, img_h = img.size

    # Font sizes scale to image width so text fits regardless of aspect ratio
    headline_size = max(36, int(img_w * 0.068))
    subline_size  = max(20, int(img_w * subline_scale))

    font_bold, font_regular = get_font_paths(brand)
    font_headline = ImageFont.truetype(font_bold,    headline_size)
    font_subline  = ImageFont.truetype(font_regular, subline_size)

    left_margin  = int(img_w * 0.06)
    right_margin = int(img_w * 0.06)
    max_text_w   = img_w - left_margin - right_margin

    # Wrap both headline and subline to fit within available width
    headline_lines = wrap_text(headline, font_headline, max_text_w)
    subline_lines  = wrap_text(subline, font_subline, max_text_w) if subline else []

    # Measure line heights
    def line_height(font, lines):
        if not lines:
            return 0, 0
        bb = font.getbbox(lines[0])
        lh = bb[3] - bb[1]
        return lh, int(lh * 1.18)

    h_lh, h_ls = line_height(font_headline, headline_lines)
    s_lh, s_ls = line_height(font_subline, subline_lines)

    headline_block_h = h_ls * len(headline_lines)
    subline_block_h  = s_ls * len(subline_lines) if subline_lines else 0
    gap   = int(img_h * LINE_GAP_FRAC)
    total_h = headline_block_h + (gap + subline_block_h if subline_lines else 0)

    edge_margin = int(img_h * TEXT_BOTTOM_MARGIN)

    if text_position == "top":
        text_block_top = edge_margin
    else:  # bottom
        text_block_top = img_h - edge_margin - total_h

    # --- Gradient scrim (top or bottom) ---
    scrim_h = int(img_h * SCRIM_HEIGHT_FRAC)
    scrim   = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd      = ImageDraw.Draw(scrim)
    if text_position == "top":
        for i in range(scrim_h):
            t = 1 - (i / scrim_h)
            alpha = int(210 * (t ** 1.6))
            sd.line([(0, i), (img_w, i)], fill=(0, 0, 0, alpha))
    else:
        scrim_top = img_h - scrim_h
        for i in range(scrim_h):
            t = i / scrim_h
            alpha = int(210 * (t ** 1.6))
            sd.line([(0, scrim_top + i), (img_w, scrim_top + i)], fill=(0, 0, 0, alpha))
    img = Image.alpha_composite(img, scrim)

    # --- Draw text ---
    draw = ImageDraw.Draw(img)
    y = text_block_top

    def x_for_line(text, font):
        if text_align == "center":
            return (img_w - font.getlength(text)) // 2
        if text_align == "right":
            return img_w - right_margin - int(font.getlength(text))
        return left_margin  # left (default)

    for line in headline_lines:
        draw_shadowed_text(draw, (x_for_line(line, font_headline), y), line, font_headline,
                           fill=(255, 255, 255), shadow_offset=2, shadow_opacity=130)
        y += h_ls

    if subline_lines:
        y += gap - h_ls + h_lh
        for line in subline_lines:
            draw_shadowed_text(draw, (x_for_line(line, font_subline), y), line, font_subline,
                               fill=(220, 220, 220), shadow_offset=1, shadow_opacity=100)
            y += s_ls

    img.convert("RGB").save(output_path, "PNG")
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 add_text_overlay.py <input> <output> <headline> [subline] [target_w] [target_h]")
        sys.exit(1)

    input_path    = sys.argv[1]
    output_path   = sys.argv[2]
    headline      = sys.argv[3]
    subline       = sys.argv[4] if len(sys.argv) > 4 else None
    target_w      = int(sys.argv[5]) if len(sys.argv) > 5 else None
    target_h      = int(sys.argv[6]) if len(sys.argv) > 6 else None
    text_align    = sys.argv[7] if len(sys.argv) > 7 else "left"
    text_position = sys.argv[8] if len(sys.argv) > 8 else "bottom"
    brand         = sys.argv[9] if len(sys.argv) > 9 else DEFAULT_BRAND
    subline_scale = float(sys.argv[10]) if len(sys.argv) > 10 else 0.030

    add_text_overlay(input_path, output_path, headline, subline, target_w, target_h, text_align, text_position, brand, subline_scale)
