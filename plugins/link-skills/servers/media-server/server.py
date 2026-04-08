#!/usr/bin/env python3
"""
media-server — MCP server for brand-aware image/video processing.

Tools:
  add_text_overlay       — Gradient scrim + text overlay on image
  add_logo               — Composite brand logo onto image
  add_text_overlay_video  — Text + logo overlay on video via ffmpeg
  generate_text_video    — Animated text Reel with brand colors
  ken_burns_video        — Ken Burns zoom on background image

Requires: Pillow, ffmpeg (system)
Reads brand fonts/logos from BRANDS_DIR env var (default: ./brands)
"""

import asyncio
import json
import os
import sys

# Add parent scripts dir so we can import existing modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.environ.get("CLAUDE_PROJECT_ROOT", os.path.join(SCRIPT_DIR, "..", ".."))
SCRIPTS_DIR = os.path.join(PROJECT_ROOT, "scripts")
sys.path.insert(0, SCRIPTS_DIR)

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Import the actual processing functions from existing scripts
from add_text_overlay import add_text_overlay
from add_logo import add_logo
from add_text_overlay_video import create_overlay_png
from generate_text_video import generate_text_video as _generate_text_video

import subprocess

server = Server("media-server")


@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="add_text_overlay",
            description="Add gradient scrim + text overlay to an image. Supports headline, subline, alignment, position, and brand-specific fonts.",
            inputSchema={
                "type": "object",
                "properties": {
                    "input_path": {"type": "string", "description": "Path to input image"},
                    "output_path": {"type": "string", "description": "Path for output image"},
                    "headline": {"type": "string", "description": "Headline text (max 6-8 words)"},
                    "subline": {"type": "string", "description": "Subline text (tagline or CTA teaser)", "default": ""},
                    "target_w": {"type": "integer", "description": "Target canvas width (e.g. 1080, 1200)"},
                    "target_h": {"type": "integer", "description": "Target canvas height (e.g. 1920, 628)"},
                    "text_align": {"type": "string", "enum": ["left", "center", "right"], "default": "left"},
                    "text_position": {"type": "string", "enum": ["bottom", "top"], "default": "bottom"},
                    "brand": {"type": "string", "description": "Brand name (must match a folder in brands/)", "default": "fivebucks"},
                },
                "required": ["input_path", "output_path", "headline", "target_w", "target_h"],
            },
        ),
        Tool(
            name="add_logo",
            description="Composite brand logo onto an image. Auto-crops transparent padding for equal visual gaps.",
            inputSchema={
                "type": "object",
                "properties": {
                    "input_path": {"type": "string", "description": "Path to input image"},
                    "output_path": {"type": "string", "description": "Path for output image"},
                    "position": {"type": "string", "enum": ["top-right", "top-left", "bottom-right", "bottom-left"], "default": "top-right"},
                    "scale": {"type": "number", "description": "Logo size as fraction of image width", "default": 0.18},
                    "brand": {"type": "string", "description": "Brand name", "default": "fivebucks"},
                },
                "required": ["input_path", "output_path"],
            },
        ),
        Tool(
            name="add_text_overlay_video",
            description="Add text + logo overlay to a video via ffmpeg. Creates transparent PNG overlay then composites onto every frame.",
            inputSchema={
                "type": "object",
                "properties": {
                    "input_path": {"type": "string", "description": "Path to input .mp4 video"},
                    "output_path": {"type": "string", "description": "Path for output .mp4 video"},
                    "headline": {"type": "string", "description": "Headline text"},
                    "subline": {"type": "string", "description": "Subline text", "default": ""},
                    "w": {"type": "integer", "description": "Video width", "default": 1080},
                    "h": {"type": "integer", "description": "Video height", "default": 1920},
                    "text_align": {"type": "string", "enum": ["left", "center", "right"], "default": "center"},
                    "text_position": {"type": "string", "enum": ["bottom", "top"], "default": "bottom"},
                    "brand": {"type": "string", "description": "Brand name", "default": "fivebucks"},
                },
                "required": ["input_path", "output_path", "headline"],
            },
        ),
        Tool(
            name="generate_text_video",
            description="Generate animated text Reel with brand colors. Three scenes with fade in/out text over animated gradient background.",
            inputSchema={
                "type": "object",
                "properties": {
                    "output_path": {"type": "string", "description": "Path for output .mp4 video"},
                    "line1": {"type": "string", "description": "Scene 1 text (hook)"},
                    "line2": {"type": "string", "description": "Scene 2 text (value)"},
                    "line3": {"type": "string", "description": "Scene 3 text (CTA)"},
                    "w": {"type": "integer", "description": "Video width", "default": 1080},
                    "h": {"type": "integer", "description": "Video height", "default": 1920},
                    "brand": {"type": "string", "description": "Brand name", "default": "fivebucks"},
                    "variation": {"type": "string", "enum": ["A", "B", "C"], "default": "A", "description": "A=dark, B=light, C=split"},
                },
                "required": ["output_path", "line1", "line2", "line3"],
            },
        ),
        Tool(
            name="ken_burns_video",
            description="Create Ken Burns zoom video from a static background image. Scales image to 1.2x headroom then applies slow zoom via ffmpeg zoompan.",
            inputSchema={
                "type": "object",
                "properties": {
                    "background_path": {"type": "string", "description": "Path to background image"},
                    "output_path": {"type": "string", "description": "Path for output .mp4 video"},
                    "w": {"type": "integer", "description": "Output video width", "default": 1080},
                    "h": {"type": "integer", "description": "Output video height", "default": 1920},
                    "duration": {"type": "integer", "description": "Video duration in seconds", "default": 9},
                },
                "required": ["background_path", "output_path"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    try:
        if name == "add_text_overlay":
            add_text_overlay(
                input_path=arguments["input_path"],
                output_path=arguments["output_path"],
                headline=arguments["headline"],
                subline=arguments.get("subline", ""),
                target_w=arguments.get("target_w"),
                target_h=arguments.get("target_h"),
                text_align=arguments.get("text_align", "left"),
                text_position=arguments.get("text_position", "bottom"),
                brand=arguments.get("brand", "fivebucks"),
            )
            return [TextContent(type="text", text=f"OK: Text overlay saved to {arguments['output_path']}")]

        elif name == "add_logo":
            add_logo(
                input_path=arguments["input_path"],
                output_path=arguments["output_path"],
                position=arguments.get("position", "top-right"),
                scale=arguments.get("scale", 0.18),
                brand=arguments.get("brand", "fivebucks"),
            )
            return [TextContent(type="text", text=f"OK: Logo overlay saved to {arguments['output_path']}")]

        elif name == "add_text_overlay_video":
            w = arguments.get("w", 1080)
            h = arguments.get("h", 1920)
            brand = arguments.get("brand", "fivebucks")
            input_path = arguments["input_path"]
            output_path = arguments["output_path"]

            # Create overlay PNG
            overlay = create_overlay_png(
                w, h,
                arguments["headline"],
                arguments.get("subline", ""),
                arguments.get("text_align", "center"),
                arguments.get("text_position", "bottom"),
                brand,
            )
            overlay_path = input_path.replace(".mp4", "_overlay.png")
            overlay.save(overlay_path)

            # Composite with ffmpeg
            cmd = [
                "ffmpeg", "-y",
                "-i", input_path,
                "-i", overlay_path,
                "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
                "-filter_complex",
                f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}[bg];[bg][1:v]overlay=0:0",
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                "-shortest",
                "-movflags", "+faststart",
                output_path,
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            os.remove(overlay_path)

            if result.returncode != 0:
                return [TextContent(type="text", text=f"ERROR: ffmpeg failed: {result.stderr[-500:]}")]
            return [TextContent(type="text", text=f"OK: Video overlay saved to {output_path}")]

        elif name == "generate_text_video":
            _generate_text_video(
                output_path=arguments["output_path"],
                line1=arguments["line1"],
                line2=arguments["line2"],
                line3=arguments["line3"],
                w=arguments.get("w", 1080),
                h=arguments.get("h", 1920),
                brand=arguments.get("brand", "fivebucks"),
                variation=arguments.get("variation", "A"),
            )
            return [TextContent(type="text", text=f"OK: Text video saved to {arguments['output_path']}")]

        elif name == "ken_burns_video":
            from PIL import Image
            bg_path = arguments["background_path"]
            output_path = arguments["output_path"]
            w = arguments.get("w", 1080)
            h = arguments.get("h", 1920)
            duration = arguments.get("duration", 9)
            fps = 30
            total_frames = duration * fps

            # Scale background to 1.2x for Ken Burns headroom
            img = Image.open(bg_path).convert("RGB")
            scale = max(w / img.width, h / img.height)
            img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
            left = (img.width - w) // 2
            top = (img.height - h) // 2
            img = img.crop((left, top, left + w, top + h))
            # Scale up 1.2x for zoom headroom
            img = img.resize((int(w * 1.2), int(h * 1.2)), Image.LANCZOS)
            tmp_bg = "/tmp/kb_bg_large.png"
            img.save(tmp_bg)

            cmd = [
                "ffmpeg", "-y",
                "-loop", "1", "-i", tmp_bg,
                "-filter_complex",
                f"zoompan=z='1+0.012*in/{total_frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s={w}x{h}:fps={fps},setsar=1:1",
                "-t", str(duration),
                "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart",
                output_path,
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            os.remove(tmp_bg)

            if result.returncode != 0:
                return [TextContent(type="text", text=f"ERROR: ffmpeg failed: {result.stderr[-500:]}")]
            return [TextContent(type="text", text=f"OK: Ken Burns video saved to {output_path}")]

        else:
            return [TextContent(type="text", text=f"ERROR: Unknown tool {name}")]

    except Exception as e:
        return [TextContent(type="text", text=f"ERROR: {type(e).__name__}: {str(e)}")]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
