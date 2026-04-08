#!/usr/bin/env python3
"""
Generate animated text Reel with brand styling. Three-layer compositing:
  1. Background: animated gradient shift (continuous motion)
  2. Logo: static overlay (always visible, never moves)
  3. Text: animated per scene (fade in/out)

Usage:
  python scripts/generate_text_video.py <output.mp4> "LINE1" "LINE2" "LINE3" <w> <h> <brand> [variation]

Variations: A (dark), B (light), C (split)
"""

import sys
import os
import subprocess
import math
import textwrap
from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_BRAND = "fivebucks"

BRAND_STYLE = {
    "fivebucks": {
        "primary": (107, 33, 168),
        "secondary": (88, 28, 140),
        "accent": (236, 72, 153),
    },
    "fiveagents": {
        "primary": (91, 33, 182),
        "secondary": (75, 25, 150),
        "accent": (124, 58, 237),
    },
}


def get_font_paths(brand):
    fonts_dir = os.path.join(SCRIPT_DIR, "..", "brands", brand, "fonts")
    B = brand.upper()
    bold = os.path.join(fonts_dir, os.environ.get(f"{B}_FONT_BOLD", "Inter-Bold.ttf"))
    regular = os.path.join(fonts_dir, os.environ.get(f"{B}_FONT_REGULAR", "Inter-Regular.ttf"))
    if not os.path.exists(bold):
        bold = os.path.join(SCRIPT_DIR, "..", "brands", DEFAULT_BRAND, "fonts",
                            os.environ.get(f"{DEFAULT_BRAND.upper()}_FONT_BOLD", "Inter-Bold.ttf"))
    if not os.path.exists(regular):
        regular = os.path.join(SCRIPT_DIR, "..", "brands", DEFAULT_BRAND, "fonts",
                               os.environ.get(f"{DEFAULT_BRAND.upper()}_FONT_REGULAR", "Inter-Regular.ttf"))
    return bold, regular


def get_logo_path(brand):
    p = os.path.join(SCRIPT_DIR, "..", "brands", brand, "logo.png")
    if not os.path.exists(p):
        p = os.path.join(SCRIPT_DIR, "..", "brands", DEFAULT_BRAND, "logo.png")
    return p


def render_background_frame(width, height, brand, variation, frame_num, total_frames):
    """Render one frame of animated background. Subtle color shift over time."""
    style = BRAND_STYLE.get(brand, BRAND_STYLE[DEFAULT_BRAND])
    t = frame_num / total_frames  # 0.0 to 1.0

    if variation == "B":
        # Light: white with subtle warm shift
        base = (250, 250, 252)
        shift = int(8 * math.sin(t * math.pi * 2))
        bg = (base[0] - abs(shift), base[1] - abs(shift)//2, base[2])
    elif variation == "C":
        # Split: brand top, white bottom, divider moves slightly
        img = Image.new("RGB", (width, height), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        split_y = height // 2 + int(30 * math.sin(t * math.pi * 2))
        p = style["primary"]
        shift = int(15 * math.sin(t * math.pi * 4))
        color = (max(0, p[0] + shift), max(0, p[1] + shift), min(255, p[2] + shift))
        draw.rectangle([0, 0, width, split_y], fill=color)
        return img
    else:
        # Dark: brand primary with slow hue shift
        p = style["primary"]
        shift = int(15 * math.sin(t * math.pi * 2))
        bg = (max(0, p[0] + shift), max(0, p[1] + shift//2), min(255, p[2] + shift))

    img = Image.new("RGB", (width, height), bg)
    return img


def render_logo_overlay(width, height, brand, scale=0.13):
    """Static transparent PNG with logo only."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    logo_path = get_logo_path(brand)
    if not os.path.exists(logo_path):
        return img
    logo = Image.open(logo_path).convert("RGBA")
    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)
    logo_w = int(width * scale)
    logo_h = int(logo.height * (logo_w / logo.width))
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    pad = int(width * 0.05)
    img.paste(logo, (pad, pad), logo)
    return img


def render_text_overlay(width, height, text, brand, variation, is_accent=False):
    """Transparent PNG with centered text only. No background, no logo."""
    style = BRAND_STYLE.get(brand, BRAND_STYLE[DEFAULT_BRAND])
    bold_path, _ = get_font_paths(brand)

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Font size — large but with generous margin
    font_size = max(44, int(width * 0.085))
    try:
        font = ImageFont.truetype(bold_path, font_size)
    except:
        font = ImageFont.load_default()

    # Wrap text with wide margins (80% of width usable)
    usable_w = int(width * 0.80)
    # Calculate max chars by measuring actual text width
    avg_char_w = font_size * 0.55
    max_chars = max(8, int(usable_w / avg_char_w))
    lines = textwrap.wrap(text, width=max_chars)

    line_h = int(font_size * 1.35)
    total_h = len(lines) * line_h
    start_y = (height - total_h) // 2

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (width - tw) // 2
        y = start_y + i * line_h

        if variation == "B":
            # Light bg: brand colored text
            if is_accent:
                color = (*style["accent"], 255)
            else:
                color = (*style["primary"], 255)
            draw.text((x, y), line, font=font, fill=color)
        elif variation == "C":
            # Split: white if in top half, dark if in bottom
            mid = height // 2
            if y + font_size // 2 < mid:
                color = (*style["accent"], 255) if is_accent else (255, 255, 255, 255)
            else:
                color = (*style["accent"], 255) if is_accent else (*style["primary"], 255)
            draw.text((x + 2, y + 2), line, font=font, fill=(0, 0, 0, 30))
            draw.text((x, y), line, font=font, fill=color)
        else:
            # Dark bg: white or accent text
            color = (*style["accent"], 255) if is_accent else (255, 255, 255, 255)
            draw.text((x + 2, y + 2), line, font=font, fill=(0, 0, 0, 50))
            draw.text((x, y), line, font=font, fill=color)

    return img


def main():
    if len(sys.argv) < 7:
        print('Usage: python generate_text_video.py <output.mp4> "LINE1" "LINE2" "LINE3" <w> <h> <brand> [variation]')
        sys.exit(1)

    output_path = sys.argv[1]
    line1 = sys.argv[2]
    line2 = sys.argv[3]
    line3 = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else ""
    width = int(sys.argv[5]) if len(sys.argv) > 5 else 1080
    height = int(sys.argv[6]) if len(sys.argv) > 6 else 1920
    brand = sys.argv[7] if len(sys.argv) > 7 else DEFAULT_BRAND
    variation = (sys.argv[8] if len(sys.argv) > 8 else "A").upper()

    tmp_dir = os.path.join(os.path.dirname(output_path) or ".", "_tmp_video")
    os.makedirs(tmp_dir, exist_ok=True)

    fps = 30
    duration = 9  # seconds total

    # Scene timing (seconds)
    scenes = [(line1, False), (line2, True)]
    if line3:
        scenes.append((line3, False))
    n_scenes = len(scenes)
    scene_dur = duration / n_scenes  # seconds per scene

    total_frames = fps * duration
    print(f"Rendering {total_frames} frames ({n_scenes} scenes, {scene_dur:.1f}s each)...")

    # Layer 1: Render animated background frames
    bg_dir = os.path.join(tmp_dir, "bg")
    os.makedirs(bg_dir, exist_ok=True)
    for f in range(total_frames):
        frame = render_background_frame(width, height, brand, variation, f, total_frames)
        frame.save(os.path.join(bg_dir, f"bg_{f:04d}.png"))

    # Layer 2: Static logo overlay
    logo_path = os.path.join(tmp_dir, "logo.png")
    logo_img = render_logo_overlay(width, height, brand)
    logo_img.save(logo_path)

    # Layer 3: Text overlays per scene
    text_paths = []
    for i, (text, accent) in enumerate(scenes):
        tp = os.path.join(tmp_dir, f"text_{i}.png")
        text_img = render_text_overlay(width, height, text, brand, variation, is_accent=accent)
        text_img.save(tp)
        text_paths.append(tp)
        print(f"  Scene {i+1}: \"{text[:40]}\"")

    # Build ffmpeg command:
    # 1. Background frames → video
    # 2. Overlay static logo
    # 3. Crossfade between text scenes on top
    fade_dur = 0.6  # fade duration in seconds
    scene_frames = int(scene_dur * fps)

    # First: build text scene videos (each text as a static image loop)
    text_video_paths = []
    for i, tp in enumerate(text_paths):
        tvp = os.path.join(tmp_dir, f"text_vid_{i}.mp4")
        subprocess.run([
            "ffmpeg", "-y",
            "-loop", "1", "-t", f"{scene_dur + fade_dur}", "-i", tp,
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18",
            "-pix_fmt", "yuva420p", "-an", tvp
        ], capture_output=True)
        text_video_paths.append(tvp)

    # Build text crossfade chain
    if n_scenes == 2:
        text_filter = (
            f"[0:v]fps={fps}[t0];"
            f"[1:v]fps={fps}[t1];"
            f"[t0][t1]xfade=transition=fade:duration={fade_dur}:offset={scene_dur}[text_out]"
        )
        text_inputs = ["-i", text_video_paths[0], "-i", text_video_paths[1]]
    else:
        offset2 = scene_dur * 2
        text_filter = (
            f"[0:v]fps={fps}[t0];"
            f"[1:v]fps={fps}[t1];"
            f"[2:v]fps={fps}[t2];"
            f"[t0][t1]xfade=transition=fade:duration={fade_dur}:offset={scene_dur}[x1];"
            f"[x1][t2]xfade=transition=fade:duration={fade_dur}:offset={offset2}[text_out]"
        )
        text_inputs = ["-i", text_video_paths[0], "-i", text_video_paths[1], "-i", text_video_paths[2]]

    # Render text crossfade video
    text_combined = os.path.join(tmp_dir, "text_combined.mp4")
    cmd_text = [
        "ffmpeg", "-y",
        *text_inputs,
        "-filter_complex", text_filter,
        "-map", "[text_out]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuva420p", "-an",
        text_combined
    ]
    subprocess.run(cmd_text, capture_output=True)

    # Render background from frames
    bg_video = os.path.join(tmp_dir, "bg.mp4")
    cmd_bg = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", os.path.join(bg_dir, "bg_%04d.png"),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p", "-an",
        bg_video
    ]
    subprocess.run(cmd_bg, capture_output=True)

    # Final composite: bg + logo + text
    print("Compositing layers...")
    cmd_final = [
        "ffmpeg", "-y",
        "-i", bg_video,
        "-i", logo_path,
        "-i", text_combined,
        "-filter_complex",
        f"[0:v][1:v]overlay=0:0[with_logo];[with_logo][2:v]overlay=0:0:shortest=1[outv]",
        "-map", "[outv]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-an",
        "-movflags", "+faststart",
        "-t", str(duration),
        output_path
    ]
    result = subprocess.run(cmd_final, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ffmpeg error: {result.stderr[-500:]}")
        sys.exit(1)

    # Cleanup
    import shutil
    shutil.rmtree(tmp_dir)

    size_kb = os.path.getsize(output_path) // 1024
    print(f"Saved: {output_path} ({size_kb}KB)")


if __name__ == "__main__":
    main()
