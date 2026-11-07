"""Download the images listed in products.csv to images/<id>/ (local only, gitignored).

Usage:  python samples/demo/fetch_images.py
Re-runnable: files that already exist are skipped, so new rows only fetch their own images.
Stdlib only. Polite: one request at a time with a 1 s pause.
"""
import csv
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "images"

MAGIC = {b"\xff\xd8\xff": ".jpg", b"\x89PNG": ".png", b"RIFF": ".webp", b"GIF8": ".gif"}


def kind(data: bytes) -> str | None:
    for sig, ext in MAGIC.items():
        if data.startswith(sig) and (sig != b"RIFF" or data[8:12] == b"WEBP"):
            return ext
    return None


def main() -> int:
    rows = list(csv.DictReader(open(HERE / "products.csv", encoding="utf-8")))
    ok = skipped = failed = 0
    for row in rows:
        urls = [row["image_link"]] + [u for u in row["additional_image_link"].split("|") if u]
        folder = OUT / row["id"]
        folder.mkdir(parents=True, exist_ok=True)
        for n, url in enumerate(urls):
            if list(folder.glob(f"{n}.*")):
                skipped += 1
                continue
            tmp = folder / f"{n}.part"
            res = subprocess.run(
                ["curl", "-sS", "-L", "--max-time", "30", "-o", str(tmp), url],
                capture_output=True,
            )
            data = tmp.read_bytes() if tmp.exists() else b""
            tmp.unlink(missing_ok=True)
            ext = kind(data) if res.returncode == 0 else None
            if not ext:
                failed += 1
                print(f"FAIL {row['id']} #{n} rc={res.returncode} bytes={len(data)} {url}")
            else:
                (folder / f"{n}{ext}").write_bytes(data)
                ok += 1
            time.sleep(1)
    print(f"downloaded={ok} skipped={skipped} failed={failed} products={len(rows)}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
