from pathlib import Path

root = Path(__file__).resolve().parents[1] / "public"
dirs = [
    "assets/shell",
    "assets/menu",
    "assets/ui/icons",
    "assets/mascot",
    "assets/audio",
    "assets/games/balloon-pop",
    "assets/games/sound-world",
]
exts = {".png", ".webp", ".jpg", ".jpeg", ".mp3", ".wav", ".ogg", ".woff2", ".ttf"}
paths: list[str] = []
for d in dirs:
    p = root / d
    if not p.exists():
        raise SystemExit(f"missing {d}")
    for f in p.rglob("*"):
        if f.is_file() and f.suffix.lower() in exts:
            paths.append(f.relative_to(root).as_posix())
paths = sorted(set(paths))
out = root.parent / "src" / "app" / "boot-assets.ts"
body = ["/** Картинки и звуки хаба + готовых игр. Boot качает их до welcome. */"]
body.append("export const BOOT_ASSET_PATHS: readonly string[] = [")
body.extend(f"  '{p}'," for p in paths)
body.append("]")
body.append("")
out.write_text("\n".join(body), encoding="utf-8")
print("count", len(paths), "bytes", sum((root / p).stat().st_size for p in paths))
print("wrote", out)
