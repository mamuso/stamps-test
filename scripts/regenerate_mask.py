"""Regenerate stamp-mask.png from assets/stamp.png for CSS mask colorization."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "assets" / "stamp.png"
DST = ROOT / "public" / "assets" / "stamp-mask.png"


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            red, green, blue, _ = pixels[x, y]
            if red > 240 and green > 240 and blue > 240:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                luminance = (red * 0.299 + green * 0.587 + blue * 0.114) / 255
                alpha = int(min(255, max(40, (1 - luminance) * 255 * 1.2)))
                pixels[x, y] = (0, 0, 0, alpha)

    img.save(DST)
    print(f"Wrote {DST}")


if __name__ == "__main__":
    main()
