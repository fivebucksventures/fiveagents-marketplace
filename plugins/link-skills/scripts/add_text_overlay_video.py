#!/usr/bin/env python3
"""
Add text overlay + logo to video using ffmpeg + brand fonts.
Same interface as add_text_overlay.py but for video files.

Usage:
  python scripts/add_text_overlay_video.py <input.mp4> <output.mp4> "HEADLINE" "Subline" <w> <h> <text_align> <text_position> <brand>

Example:
  python scripts/add_text_overlay_video.py raw.mp4 final.mp4 "7 HOURS TO 30 MINUTES" "AI agents for invoice automation" 1080 1920 center bottom fiveagents

Process:
  1. Extracts a frame from video
  2. Generates text overlay + logo as a transparent PNG (using add_text_overlay.py logic)
  3. Composites the overlay onto every frame via ffmpeg
"""

import sys
import os
import subprocess
import textwrap
from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_BRAND = "fivebucks"


def get_font_paths(brand=DEFAULT_BRAND):
    fonts_dir = os.path.join(SCRIPT_DIR, "..", "brands", brand, "fonts")
    B = brand.upper()
    bold_path = os.path.join(fonts_dir, os.environ.get(f"{B}_FONT_BOLD", "Inter-Bold.ttf"))
    regular_path = os.path.join(fonts_dir, os.environ.get(f"{B}_FONT_REGULAR", "Inter-Regular.ttf"))
    if not os.path.exists(bold_path):
        fallback_dir = os.path.join(SCRIPT_DIR, "..", "brands", DEFAULT_BRAND, "fonts")
        bold_path = os.path.join(fallback_dir, os.environ.get(f"{DEFAULT_BRAND.upper()}_FONT_BOLD", "Inter-Bold.ttf"))
    if not os.path.exists(regular_path):
        fallback_dir = os.path.join(SCRIPT_DIR, "..", "brands", DEFAULT_BRAND, "fonts")
        regular_path = os.path.join(fallback_dir, os.environ.get(f"{DEFAULT_BRAND.upper()}_FONT_REGULAR", "Inter-Regular.ttf"))
    return bold_path, regular_path


def get_logo_path(brand=DEFAULT_BRAND):
    logo_path = os.path.join(SCRIPT_DIR, "..", "brands", brand, "logo.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(SCRIPT_DIR, "..", "brands", DEFAULT_BRAND, "logo.png")
    return logo_path


def create_overlay_png(width, height, headline, subline, text_align, text_position, brand, logo_position="top-right", logo_scale=0.18):
    """Create a transparent PNG with text overlay + logo, same style as add_text_overlay.py."""
    bold_path, regular_path = get_font_paths(brand)
    logo_path = get_logo_path(brand)

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Scale fonts to canvas width
    headline_size = max(28, int(width * 0.055))
    subline_size = max(18, int(width * 0.032))
    try:
        font_bold = ImageFont.truetype(bold_path, headline_size)
        font_regular = ImageFont.truetype(regular_path, subline_size)
    except Exception:
        font_bold = ImageFont.load_default()
        font_regular = ImageFont.load_default()

    margin = int(width * 0.06)
    max_chars_headline = max(15, int(width / (headline_size * 0.55)))
    max_chars_subline = max(25, int(width / (subline_size * 0.5)))

    headline_lines = textwrap.wrap(headline, width=max_chars_headline) if headline else []
    subline_lines = textwrap.wrap(subline, width=max_chars_subline) if subline else []

    # Calculate text block height
    line_spacing_h = int(headline_size * 0.3)
    line_spacing_s = int(subline_size * 0.25)
    gap = int(headline_size * 0.4)

    h_block = len(headline_lines) * (headline_size + line_spacing_h)
    s_block = len(subline_lines) * (subline_size + line_spacing_s)
    total_text_h = h_block + gap + s_block

    # Gradient scrim
    scrim_height = total_text_h + margin * 4
    if text_position == "top":
        scrim_y = 0
        text_start_y = margin * 2
    else:
        scrim_y = height - scrim_height
        text_start_y = height - scrim_height + margin * 2

    for i in range(scrim_height):
        if text_position == "top":
            alpha = int(180 * (1 - i / scrim_height))
        else:
            alpha = int(180 * (i / scrim_height))
        y = scrim_y + i
        draw.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))

    # Draw headline
    y = text_start_y
    for line in headline_lines:
        bbox = draw.textbbox((0, 0), line, font=font_bold)
        tw = bbox[2] - bbox[0]
        if text_align == "center":
            x = (width - tw) // 2
        elif text_align == "right":
            x = width - margin - tw
        else:
            x = margin
        # Shadow
        draw.text((x + 2, y + 2), line, font=font_bold, fill=(0, 0, 0, 160))
        draw.text((x, y), line, font=font_bold, fill=(255, 255, 255, 255))
        y += headline_size + line_spacing_h

    y += gap

    # Draw subline
    for line in subline_lines:
        bbox = draw.textbbox((0, 0), line, font=font_regular)
        tw = bbox[2] - bbox[0]
        if text_align == "center":
            x = (width - tw) // 2
        elif text_align == "right":
            x = width - margin - tw
        else:
            x = margin
        draw.text((x + 1, y + 1), line, font=font_regular, fill=(0, 0, 0, 120))
        draw.text((x, y), line, font=font_regular, fill=(255, 255, 255, 230))
        y += subline_size + line_spacing_s

    # Logo
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        # Crop to content
        bbox = logo.getbbox()
        if bbox:
            logo = logo.crop(bbox)
        logo_w = int(width * logo_scale)
        logo_h = int(logo.height * (logo_w / logo.width))
        logo = logo.resize((logo_w, logo_h), Image.LANCZOS)

        pad = int(width * 0.03)
        if "right" in logo_position:
            lx = width - logo_w - pad
        else:
            lx = pad
        if "bottom" in logo_position:
            ly = height - logo_h - pad
        else:
            ly = pad

        overlay.paste(logo, (lx, ly), logo)

    return overlay


def main():
    if len(sys.argv) < 6:
        print("Usage: python add_text_overlay_video.py <input.mp4> <output.mp4> \"HEADLINE\" \"Subline\" <w> <h> [text_align] [text_position] [brand]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    headline = sys.argv[3]
    subline = sys.argv[4] if len(sys.argv) > 4 else ""
    width = int(sys.argv[5]) if len(sys.argv) > 5 else 1080
    height = int(sys.argv[6]) if len(sys.argv) > 6 else 1920
    text_align = sys.argv[7] if len(sys.argv) > 7 else "center"
    text_position = sys.argv[8] if len(sys.argv) > 8 else "bottom"
    brand = sys.argv[9] if len(sys.argv) > 9 else DEFAULT_BRAND

    if not os.path.exists(input_path):
        print(f"ERROR: Input video not found: {input_path}")
        sys.exit(1)

    # Create overlay PNG
    overlay_path = input_path.replace(".mp4", "_overlay.png")
    overlay = create_overlay_png(width, height, headline, subline, text_align, text_position, brand)
    overlay.save(overlay_path)
    print(f"Overlay: {overlay_path}")

    # Composite with ffmpeg
    # Scale video to fill canvas, then overlay the transparent PNG
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-i", overlay_path,
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-filter_complex",
        f"[0:v]scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}[bg];[bg][1:v]overlay=0:0",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest",  # Silent audio track — Facebook Reels require an audio stream
        "-movflags", "+faststart",
        output_path
    ]

    print(f"Running ffmpeg...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ffmpeg error: {result.stderr[-500:]}")
        sys.exit(1)

    # Cleanup overlay
    os.remove(overlay_path)
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    main()
