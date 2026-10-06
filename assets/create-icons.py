"""Package the approved logo as Windows ICO and PNG assets; no retouching."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent
with Image.open(root / "rohrplan-logo-source.png") as source:
    image = source.convert("RGBA")
    image.save(root / "rohrplan.ico", format="ICO",
               sizes=[(size, size) for size in (16, 24, 32, 48, 64, 128, 256)])
    image.resize((512, 512), Image.Resampling.LANCZOS).save(root / "rohrplan.png")
    image.resize((32, 32), Image.Resampling.LANCZOS).save(root / "favicon.png")
print("Windows ICO, application PNG and favicon saved in assets.")
