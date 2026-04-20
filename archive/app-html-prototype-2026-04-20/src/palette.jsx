// palette.jsx — dominant-color palette extraction per hero image.
// Exposes on window:
//   extractPalette(src, k=4): Promise<Array<{hex, oklch?}>>   (sorted dark → light)
//   usePalette(stop, assetsPool): string[]                    (React hook; [] while loading)
// Results cached in window.__lcPaletteCache so repeat calls are cheap.

window.__lcPaletteCache = window.__lcPaletteCache || {};

// ---- color math ------------------------------------------------------------
function rgbToHex(r, g, b) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

function luminance(r, g, b) {
  // Rec. 709 relative luminance — good enough for sorting.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---- extractPalette --------------------------------------------------------
function extractPalette(src, k = 4) {
  if (!src) return Promise.resolve([]);
  const cacheKey = src + '|k=' + k;
  if (window.__lcPaletteCache[cacheKey]) {
    return Promise.resolve(window.__lcPaletteCache[cacheKey]);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = 40, H = 40;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;

        // Quantize pixels onto a 16-step grid so we can bucket + dedupe quickly.
        const STEP = 16;
        const pixels = [];
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          const r = Math.round(data[i]     / STEP) * STEP;
          const g = Math.round(data[i + 1] / STEP) * STEP;
          const b = Math.round(data[i + 2] / STEP) * STEP;
          pixels.push([r, g, b]);
        }
        if (pixels.length === 0) { resolve([]); return; }

        // Seed k centroids by sampling evenly through the pixel array.
        const centroids = [];
        const stride = Math.max(1, Math.floor(pixels.length / k));
        for (let i = 0; i < k; i++) {
          const p = pixels[Math.min(pixels.length - 1, i * stride)];
          centroids.push([p[0], p[1], p[2]]);
        }

        // 5 k-means iterations.
        for (let iter = 0; iter < 5; iter++) {
          const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
          for (let p = 0; p < pixels.length; p++) {
            const [pr, pg, pb] = pixels[p];
            let best = 0, bestD = Infinity;
            for (let c = 0; c < k; c++) {
              const dr = pr - centroids[c][0];
              const dg = pg - centroids[c][1];
              const db = pb - centroids[c][2];
              const d = dr * dr + dg * dg + db * db;
              if (d < bestD) { bestD = d; best = c; }
            }
            sums[best][0] += pr;
            sums[best][1] += pg;
            sums[best][2] += pb;
            sums[best][3] += 1;
          }
          for (let c = 0; c < k; c++) {
            if (sums[c][3] > 0) {
              centroids[c][0] = sums[c][0] / sums[c][3];
              centroids[c][1] = sums[c][1] / sums[c][3];
              centroids[c][2] = sums[c][2] / sums[c][3];
            }
          }
        }

        const palette = centroids
          .map(([r, g, b]) => ({
            hex: rgbToHex(r, g, b),
            lum: luminance(r, g, b),
          }))
          .sort((a, b) => a.lum - b.lum)
          .map(({ hex }) => ({ hex }));

        window.__lcPaletteCache[cacheKey] = palette;
        resolve(palette);
      } catch (err) {
        // CORS-tainted canvas, etc. — return empty so callers fall back.
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = src;
  });
}

// ---- usePalette (React hook) ----------------------------------------------
function usePalette(stop, assetsPool) {
  const [palette, setPalette] = React.useState([]);

  // Resolve the hero image URL for this stop.
  const heroUrl = React.useMemo(() => {
    if (!stop) return null;
    if (typeof window.heroUrlFor === 'function') {
      return window.heroUrlFor(stop, assetsPool || []);
    }
    // Fallback — mirrors heroUrlFor in workspace.jsx.
    if (stop.heroAssetId && assetsPool) {
      const a = assetsPool.find(x => x.id === stop.heroAssetId);
      if (a && a.imageUrl) return a.imageUrl;
    }
    return (window.STOP_IMAGES && window.STOP_IMAGES[stop.n]) || null;
  }, [stop, assetsPool]);

  React.useEffect(() => {
    let cancelled = false;
    if (!heroUrl) { setPalette([]); return; }
    // Serve from cache synchronously when possible.
    const cacheKey = heroUrl + '|k=4';
    if (window.__lcPaletteCache[cacheKey]) {
      setPalette(window.__lcPaletteCache[cacheKey].map(p => p.hex));
      return;
    }
    extractPalette(heroUrl, 4).then(pal => {
      if (cancelled) return;
      setPalette(pal.map(p => p.hex));
    });
    return () => { cancelled = true; };
  }, [heroUrl]);

  return palette;
}

Object.assign(window, { extractPalette, usePalette });
