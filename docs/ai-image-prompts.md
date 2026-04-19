# AI Image Prompts — London Cuts Pitch Deck

生成图片后，按文件名放到 `pitch-deck/assets/` **替换同名文件**，然后重跑 PDF 渲染（见本仓库 README 或 `START-LIVE-DEMO.command`）。

所有图统一规格：**1920 × 1080 px，JPEG**（Midjourney 用 `--ar 16:9 --style raw`；DALL-E / Ideogram 选 1792×1024 或 16:9）。

---

## 基调统一要求（贴在每条 prompt 末尾）

> shot on iPhone, no HDR, visible grain, late afternoon to dusk London light, warm amber / ember palette with occasional cool accents, editorial documentary aesthetic, shallow depth of field, avoid tourist clichés, no text, no watermarks, no logos

---

## 必换的 3 张主图

### 1. `seed-waterloo-bridge.jpg` — S01 Cover 全出血主视觉

> A wide, editorial-grade photograph of Waterloo Bridge at dusk seen from the South Bank, with the moody silhouette of St Paul's dome in the far distance. Glowing sodium streetlights just switched on, the Thames reflecting oxblood red and cool blue. Pedestrians as soft blurred shapes crossing the bridge. Cinematic but restrained — think Saul Leiter meets London Review of Books cover. *Shot on iPhone, visible grain, dusk amber palette, no text.*

**替代选项**（如果上面的出图太 touristy）：

> The stone undercroft of a medieval London crypt-turned-cafe, golden-hour light slicing through gothic arches, empty wooden benches, a single reader in the far corner. Quiet editorial photograph, warm cream walls, oxblood accent from a leather chair. *Shot on iPhone, grain, shallow DOF.*

### 2. `seed-southbank.jpg` — S04 Modes 三栏主图（核心 hero 图）

> Regent Street at Christmas, looking up at the legendary golden angel light installations hovering above the street. Red London double-decker bus entering frame from left. Shoppers blurred into warm halos. The whole scene feels Saul Leiter — rich amber and gold against wet pavement reflections. Vertical compositional energy, magical but not kitsch. *Shot on iPhone, late evening, grain, warm amber palette.*

### 3. `seed-market-detail.jpg` — S06 PUBLISH (postcard step)

> Piccadilly Circus at night. A line of red London buses at a traffic stop, tail-lights streaming red. Wet black road reflecting neon signage. A lone cyclist crossing the frame. High-contrast cinematic, colour palette dominated by black, red, and distant neon blue. *Shot on iPhone, long exposure feel, minimal post.*

---

## 可选替换（加分项）

### 4. `seed-golden-hour.jpg` — S06 CAPTURE

> London Underground platform, Bakerloo line, afternoon. A red Tube train pulling in with motion blur. Two or three passengers waiting — backs turned, shot candidly from behind. Tiled curved tunnel walls lit amber. Vintage Underground roundel just visible top-left. *Shot on iPhone, grain, quiet editorial tone.*

### 5. `seed-borough-market.jpg` — S06 DRAFT

> Close-up detail of an old Georgian church window in Borough, SE1. Stained and textured glass panels in deep jewel tones — amber, forest green, cobalt. Yellow afternoon sun on the lead cames. Shot from inside, slightly from below, at a tilted angle. *Shot on iPhone, shallow DOF, film grain.*

### 6. `seed-thames.jpg` — S06 TUNE

> Rooftop view of Bermondsey chimneys at pink-and-gold sunset. Brick terraces in silhouette, the Shard half-hidden in distant mist, pastel cirrus clouds over a slate-grey river horizon. Quiet and painterly. *Shot on iPhone, dusk, muted warm palette.*

---

## 三个 Mode 的风格 reference（可选 —— 如果想让 S04 三栏**各用一张 AI 图**）

⚠️ **警告：** 这会打破原设计"同一张照片，三种读法"的核心叙事。推荐保持三栏用同一张图（`seed-southbank.jpg`），只在排版/字体/滤镜上做差异。但如果你坚持要三张图：

### 4a. `seed-mode-fashion.jpg` — Fashion 版
> A solitary woman in a long wool coat walks away from camera down Bermondsey Street at amber dusk. Shop windows glow warm gold. She carries a paperback. Editorial fashion photography — Juergen Teller quiet mode. Cream / plum / oxblood palette. *Shot on film, grain.*

### 4b. `seed-mode-punk.jpg` — Punk 版
> Same Bermondsey Street at night — but now raw, high-contrast, red neon bleeding onto wet pavement. Spray-painted shutter in frame. Overexposed highlights. Zine-aesthetic. Black / white / electric red palette. *Shot on iPhone, night, hard flash.*

### 4c. `seed-mode-cinema.jpg` — Cinema 版
> Same Bermondsey Street, but letterboxed widescreen feel — 21:9 composition. Deep indigo night sky, a single window glowing yellow like a subtitle. Cold cinematic grading, Villeneuve or Chung Wai palette. *Shot on iPhone, anamorphic-style crop, deep shadows.*

---

## 工作流

1. 在你选的 AI 工具生图（Midjourney 推荐 `--style raw --ar 16:9 --v 6`）
2. 每张下载为 JPEG，按上面的文件名命名
3. 替换 `pitch-deck/assets/` 里对应的同名文件
4. 双击 `START-LIVE-DEMO.command` 或重跑 PDF 渲染命令（见 README）
5. PDF 自动用新图重新生成

图文件名必须完全一致，JSX 里硬编码了这些路径 —— 改名等于改源码。
