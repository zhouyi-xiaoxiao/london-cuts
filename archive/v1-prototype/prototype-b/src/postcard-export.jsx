// postcard-export.jsx — renders the three mode postcards onto a <canvas>
// and triggers a real PNG download. No external deps. No html2canvas.
//
// Output: 2100 × 1500 px (7:5), suitable for 350dpi 148×105mm print.
//
// Kept intentionally close to the DOM design in public-postcard.jsx — if you
// tweak a label or crop there, match it here.

const LC_POSTCARD_W = 2100;
const LC_POSTCARD_H = 1500;

function __lcFillStripes(ctx, x, y, w, h, { angle, band, color1, color2 }) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((angle * Math.PI) / 180);
  const diag = Math.hypot(w, h) + 200;
  for (let i = -diag; i < diag; i += band * 2) {
    ctx.fillStyle = color1;
    ctx.fillRect(-diag, i, diag * 2, band);
    ctx.fillStyle = color2;
    ctx.fillRect(-diag, i + band, diag * 2, band);
  }
  ctx.restore();
}

function __lcCenterText(ctx, text, x, y, maxWidth, font, color, { align = 'left', baseline = 'alphabetic' } = {}) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}

function __lcWrapText(ctx, text, x, y, maxWidth, lineHeight, font, color, { align = 'left' } = {}) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  ctx.restore();
  return yy;
}

function drawPostcardFront(ctx, mode, ctx2) {
  const W = LC_POSTCARD_W, H = LC_POSTCARD_H;
  ctx.clearRect(0, 0, W, H);

  if (mode === 'punk') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    __lcFillStripes(ctx, 0, 0, W, H, { angle: 45, band: 22, color1: '#111', color2: '#e8e8e8' });
    // red SE1 stamp
    ctx.save();
    ctx.translate(120, 120);
    ctx.rotate(-3 * Math.PI / 180);
    ctx.fillStyle = 'oklch(0.62 0.24 25)';
    ctx.fillRect(0, 0, 300, 110);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 72px "Archivo Black", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('SE1\!\!', 30, 58);
    ctx.restore();
    // ransom title
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 220px "Archivo Black", system-ui, sans-serif';
    ctx.textBaseline = 'top';
    // drop shadow in accent
    ctx.shadowColor = 'oklch(0.62 0.24 25)';
    ctx.shadowOffsetX = 12; ctx.shadowOffsetY = 12;
    ctx.fillText('GREETINGS', 120, 780);
    ctx.fillText('FROM', 120, 980);
    ctx.fillText('WATERLOO', 120, 1180);
    ctx.restore();
    return;
  }

  if (mode === 'cinema') {
    ctx.fillStyle = 'oklch(0.1 0.015 250)';
    ctx.fillRect(0, 0, W, H);
    __lcFillStripes(ctx, 0, 0, W, H, { angle: 135, band: 20, color1: 'oklch(0.2 0.01 250)', color2: 'oklch(0.24 0.01 250)' });
    // letterbox bars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, 120);
    ctx.fillRect(0, H - 120, W, 120);
    // scene marker
    ctx.fillStyle = 'oklch(0.88 0.14 90)';
    ctx.font = '500 40px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('SE1 · SCENE 05 · 17:19', 80, 160);
    // subtitle
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(W / 2 - 720, H - 300, 1440, 90);
    ctx.fillStyle = 'oklch(0.88 0.14 90)';
    ctx.font = '500 46px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('— The river is the only thing in London that tells the time.', W / 2, H - 255);
    ctx.restore();
    return;
  }

  // Fashion (default)
  ctx.fillStyle = 'oklch(0.98 0.008 75)';
  ctx.fillRect(0, 0, W, H);
  // right half: warm striped "photo"
  __lcFillStripes(ctx, W * 0.4, 0, W * 0.6, H, { angle: 135, band: 22, color1: 'oklch(0.82 0.04 50)', color2: 'oklch(0.86 0.03 55)' });
  // left content
  ctx.save();
  ctx.fillStyle = 'oklch(0.2 0.02 40)';
  ctx.font = '500 30px "JetBrains Mono", ui-monospace, monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('LONDON · SE1', 100, 110);
  // title
  ctx.font = 'italic 180px "Bodoni Moda", "Didot", serif';
  ctx.fillText('Waterloo', 100, H - 580);
  ctx.font = '300 italic 160px "Bodoni Moda", "Didot", serif';
  ctx.fillText('Bridge', 100, H - 390);
  // edition
  ctx.font = '500 30px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'oklch(0.3 0.02 40)';
  ctx.fillText('ED. 01 / 05 OF 10', 100, H - 180);
  ctx.restore();
  // photo label chip
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(W - 620, H - 130, 560, 64);
  ctx.fillStyle = 'oklch(0.35 0.01 60)';
  ctx.font = '500 24px "JetBrains Mono", ui-monospace, monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText('BRIDGE · EAST · 17:19', W - 600, H - 98);
  ctx.restore();
}

function drawPostcardBack(ctx, mode, stopId = '05') {
  const W = LC_POSTCARD_W, H = LC_POSTCARD_H;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'oklch(0.96 0.008 60)';
  ctx.fillRect(0, 0, W, H);

  // Get message and recipient from store
  const state = lcGetState ? lcGetState() : null;
  const stop = state?.stops?.find(s => s.n === stopId);
  const msg = stop?.message || DEFAULT_MESSAGE || "M — walked home across Waterloo last night. The river caught. Thought of you in Lisbon. Six minutes of gold, then nothing.";
  const rcpt = stop?.recipient || DEFAULT_RECIPIENT || { name: 'Matteo Ricci', addressLines: ['Rua das Flores 28', '1200-195 Lisboa'], country: 'Portugal' };

  // vertical divider
  ctx.strokeStyle = 'oklch(0.8 0.008 60)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.58, 120);
  ctx.lineTo(W * 0.58, H - 120);
  ctx.stroke();

  // message (handwriting)
  ctx.fillStyle = 'oklch(0.25 0.02 240)';
  ctx.font = '400 62px "Caveat", cursive';
  __lcWrapText(ctx, msg, 120, 180, W * 0.55 - 200, 90, '400 62px "Caveat", cursive', 'oklch(0.25 0.02 240)');
  ctx.fillText('— A.', 120, H - 260);

  // address block
  const x0 = W * 0.58 + 80;
  ctx.fillStyle = 'oklch(0.25 0.008 60)';
  ctx.font = '500 28px "JetBrains Mono", ui-monospace, monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('LONDON CUTS · ED.01 / 05', x0, 180);
  const rows = [rcpt.name, ...(rcpt.addressLines || []), rcpt.country];
  ctx.strokeStyle = 'oklch(0.55 0.008 60)';
  ctx.lineWidth = 2;
  rows.forEach((r, i) => {
    const y = 280 + i * 80;
    ctx.fillStyle = 'oklch(0.2 0.008 60)';
    ctx.font = '400 34px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(r, x0, y);
    ctx.beginPath();
    ctx.moveTo(x0, y + 58); ctx.lineTo(W - 340, y + 58); ctx.stroke();
  });

  // stamp box
  const stampW = 180, stampH = 230;
  const sx = W - 260, sy = H - 340;
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = 'oklch(0.4 0.008 60)';
  ctx.lineWidth = 3;
  ctx.strokeRect(sx, sy, stampW, stampH);
  ctx.restore();
  ctx.fillStyle = 'oklch(0.35 0.008 60)';
  ctx.textAlign = 'center';
  ctx.font = '500 24px "JetBrains Mono", ui-monospace, monospace';
  const labelLines = ['1ST', 'CLASS', '—', 'SE1'];
  labelLines.forEach((l, i) => ctx.fillText(l, sx + stampW / 2, sy + 60 + i * 38));
  ctx.textAlign = 'left';
}

// Public API
async function exportPostcardPNG({ mode = 'fashion', side = 'front', filename } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = LC_POSTCARD_W;
  canvas.height = LC_POSTCARD_H;
  const ctx = canvas.getContext('2d');
  if (side === 'back') drawPostcardBack(ctx, mode);
  else drawPostcardFront(ctx, mode);
  const name = filename || `london-cuts-postcard-${mode}-${side}.png`;
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return { name, blob, dataUrl: url };
}

async function exportPostcardBoth({ mode = 'fashion' } = {}) {
  await exportPostcardPNG({ mode, side: 'front' });
  // tiny stagger so browsers don't swallow the second download
  await new Promise(r => setTimeout(r, 350));
  await exportPostcardPNG({ mode, side: 'back' });
}

Object.assign(window, { exportPostcardPNG, exportPostcardBoth, LC_POSTCARD_W, LC_POSTCARD_H });
