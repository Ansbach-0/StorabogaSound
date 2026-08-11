"""Album art dominant color extractor with HSL clamping."""

import colorsys
import io
import urllib.request
from colorthief import ColorThief
from PIL import Image


def extract_accent_color(image_url: str | None) -> str | None:
    """Download image, extract dominant color via colorthief, HSL clamp, return hex string."""
    if not image_url:
        return None

    try:
        req = urllib.request.Request(
            image_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            image_bytes = response.read()

        # Validate image format using Pillow
        image_stream = io.BytesIO(image_bytes)
        with Image.open(image_stream) as img:
            img.verify()

        image_stream.seek(0)
        color_thief = ColorThief(image_stream)
        dominant_color = color_thief.get_color(quality=1)  # (r, g, b)

        r, g, b = [c / 255.0 for c in dominant_color]
        h, l, s = colorsys.rgb_to_hls(r, g, b)

        # HSL clamp: saturation 40-70%, lightness 55-75%
        s_clamped = max(0.40, min(0.70, s))
        l_clamped = max(0.55, min(0.75, l))

        r_new, g_new, b_new = colorsys.hls_to_rgb(h, l_clamped, s_clamped)

        r_int = int(round(r_new * 255))
        g_int = int(round(g_new * 255))
        b_int = int(round(b_new * 255))

        return f"#{r_int:02X}{g_int:02X}{b_int:02X}"
    except Exception:
        return None
