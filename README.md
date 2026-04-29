# AIO Converter

**A 100% offline Windows desktop app for converting images, videos, GIFs, and documents.**

Created by [Salimuddin](https://github.com/salimuddin07).

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11-blue.svg)](#)
[![Built with](https://img.shields.io/badge/Built%20with-Electron-47848f.svg)](https://www.electronjs.org/)

> No internet required. No accounts. No uploads. Your files never leave your computer.

---

## ✨ What it does

| Category | Features |
|---|---|
| 🖼️ **Images** | Convert between JPEG, PNG, WebP, AVIF, JXL, BMP, TIFF, GIF · Resize · Optimize · Batch process · Add text |
| 🎬 **Video → GIF** | Convert any video to a high-quality animated GIF · Trim start/end · Adjust FPS, dimensions, quality |
| 🎞️ **GIFs & Frames** | Split GIFs into frames · Extract frames from video · Build GIFs from images · APNG creator |
| 📄 **Documents** | PDF → Markdown · Markdown → PDF · Images → PDF · Plain text → Markdown |
| 🚀 **Modern formats** | Convert to AVIF and JPEG XL (JXL) for next-gen web images |

---

## 📥 Install

1. Download **`AIO-Converter-1.0.0-win-x64.zip`** from your Gumroad receipt.
2. **Right-click the zip → Extract All** to anywhere you like (Desktop, Documents, etc.).
3. Open the extracted folder and double-click **`AIO Converter.exe`**.
4. **Windows SmartScreen warning?** Click **More info → Run anyway**. This is normal for new independent software (the app is unsigned). Nothing connects to the internet.

That's it. To create a shortcut, right-click `AIO Converter.exe` → **Send to → Desktop**.

> The app is **portable** — copy the folder anywhere, run from a USB stick, no installation needed.

---

## 🖥️ System requirements

- Windows 10 or 11 (64-bit)
- 4 GB RAM (8 GB recommended for large videos)
- ~500 MB free disk space
- An additional ~1–5 GB temporary space when processing large files

---

## 🛡️ Privacy

Everything runs **locally** on your machine using bundled [FFmpeg](https://ffmpeg.org/) and [Sharp](https://sharp.pixelplumbing.com/). The app makes **no network calls** during conversions. You can verify this by disabling your internet — every feature still works.

---

## 🐞 Troubleshooting

| Problem | Fix |
|---|---|
| "Windows protected your PC" on first launch | Click **More info → Run anyway** (unsigned installer; safe). |
| App won't open | Right-click the shortcut → **Run as administrator** once. |
| Conversion fails for huge files | Free up disk space (need ~3× the file size) and try again. |
| Output saved where? | A **Save As** dialog appears for every conversion — you choose. |

For anything else, contact support via your Gumroad receipt or open an issue on GitHub.

---

## 🛠️ For developers (building from source)

```bash
# 1. Clone & install
git clone https://github.com/salimuddin07/GIF-converter.git
cd "AIO converter"
npm install
cd frontend && npm install && cd ..

# 2. Run in dev mode
npm run dev

# 3. Build the Gumroad-ready zip (one command)
npm run dist
```

Or just **double-click `BUILD.bat`** in the project root.

Output: `dist\AIO-Converter-1.0.0-win-x64.zip` — that's the single file you upload to Gumroad. Buyers extract it and run `AIO Converter.exe` inside.

---

## 📜 License

MIT License — see [LICENSE](LICENSE).

---

## 👤 Author

**Salimuddin** — [GitHub](https://github.com/salimuddin07) · [LinkedIn](https://www.linkedin.com/in/salimuddin-shaikh-330a7b2a5)

If this app helps you, please consider supporting development on [Gumroad](https://gumroad.com/) ☕.
