// publish.jsx — Publish slideover. Real pre-flight, real publish action,
// real clipboard + open-in-tab. All data comes from the store.

function PublishSlideover({ mode, onClose }) {
  const stops   = useLCStore(s => s.stops);
  const project = useLCStore(s => s.project);
  const assets  = useLCStore(s => s.assetsPool);
  const summary = projectSummary(stops);

  // Fall back to a slug derived from the current title rather than a hardcoded
  // "a-year-in-se1" — that leaked SE1 into every new project's publish dialog.
  const derivedSlug = (project.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
  const [slug, setSlug] = React.useState(project.slug || derivedSlug);
  const [visibility, setVisibility] = React.useState(project.visibility || 'public');
  const [toast, setToast] = React.useState(null);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const blockers = [];
  stops.forEach(s => {
    if (!s.status.upload) blockers.push({ stop: s, kind: 'Missing uploads' });
    if (!s.status.hero)   blockers.push({ stop: s, kind: 'No hero image' });
    if (!s.status.body)   blockers.push({ stop: s, kind: 'Body empty' });
  });

  const publicUrl = `${location.origin}${location.pathname}#public`;

  const jumpTo = (stopId) => {
    storeActions.setActiveStop(stopId);
    onClose();
  };

  const handlePublish = () => {
    storeActions.setSlug(slug);
    storeActions.setVisibility(visibility);
    if (visibility === 'public') {
      storeActions.publishProject();
      setToast('Published! Opening public page…');
      setTimeout(() => { location.hash = '#public'; onClose(); }, 700);
    } else {
      storeActions.setVisibility(visibility);
      setToast(`Saved as ${visibility}.`);
      setTimeout(() => setToast(null), 1500);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setToast('Link copied');
    } catch {
      setToast('Copy failed — URL: ' + publicUrl);
    }
    setTimeout(() => setToast(null), 1500);
  };

  const handleOpen = () => window.open(publicUrl, '_blank');

  // Load an image with a crossOrigin hint. Resolves with the HTMLImageElement
  // on success, or null if blocked / failed. A 6s timeout avoids hangs.
  const loadImageSafe = (url) => new Promise(resolve => {
    if (!url) return resolve(null);
    const img = new Image();
    let settled = false;
    const finish = (v) => { if (!settled) { settled = true; resolve(v); } };
    img.crossOrigin = 'anonymous';
    img.onload  = () => finish(img);
    img.onerror = () => finish(null);
    setTimeout(() => finish(null), 6000);
    img.src = url;
  });

  // Lowercase-alphanumeric-with-dashes slug from a title.
  const slugify = (s) => (s || 'stop')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'stop';

  // Fetch an image URL and return a base64 data URL suitable for jsPDF.
  // Returns null on CORS failure / network error — caller should fall back.
  const imageToDataUrl = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // Pre-crop an image to a given mm aspect ratio (targetW:targetH) via canvas,
  // so jsPDF's addImage doesn't stretch it. Uses object-fit:cover semantics —
  // the shorter edge fills, longer edge gets cropped equally from both sides.
  // Input: image data URL + output aspect ratio in mm; output: data URL of the
  // cropped JPEG at ~1600px long edge (plenty for A6 print).
  const coverCrop = async (dataUrl, targetW, targetH) => {
    if (!dataUrl) return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const targetRatio = targetW / targetH;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (imgRatio > targetRatio) {
          // Image wider than target — crop sides.
          sw = img.naturalHeight * targetRatio;
          sx = (img.naturalWidth - sw) / 2;
        } else if (imgRatio < targetRatio) {
          // Image taller than target — crop top/bottom.
          sh = img.naturalWidth / targetRatio;
          sy = (img.naturalHeight - sh) / 2;
        }
        // Scale output so long edge is max 1600px.
        const maxEdge = 1600;
        const outScale = Math.min(1, maxEdge / Math.max(sw, sh));
        const outW = Math.max(1, Math.round(sw * outScale));
        const outH = Math.max(1, Math.round(sh * outScale));
        const canvas = document.createElement('canvas');
        canvas.width = outW; canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        try { resolve(canvas.toDataURL('image/jpeg', 0.88)); }
        catch { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
    });
  };

  // Preload the hero image to detect orientation before picking jsPDF format.
  // Returns 'portrait' | 'landscape'. Falls back to landscape on any failure.
  // Prefer the EXIF-aware detector from workspace.jsx so phone-shot portrait
  // JPEGs (EXIF orientation 5/6/7/8) are classified correctly even if the
  // browser doesn't post-rotate naturalWidth/Height.
  const detectOrientation = async (url) => {
    if (!url) return 'landscape';
    if (typeof window.detectOrientationAsync === 'function') {
      try { return await window.detectOrientationAsync(url); }
      catch (_) { /* fall through to local measurement */ }
    }
    const img = await loadImageSafe(url);
    if (!img) return 'landscape';
    const w = img.naturalWidth || img.width || 1;
    const h = img.naturalHeight || img.height || 1;
    return h > w * 1.08 ? 'portrait' : 'landscape';
  };

  // Render one stop (front + back) onto the given jsPDF doc. Per-stop orientation:
  // the caller passes the orientation we already detected (so multi-stop PDFs
  // can mix portrait + landscape pages via addPage(format, orientation)).
  // If `addFirstPage` is true, we add two new A6 pages of the right orientation.
  // If false, the first page is already present but we may need to override its
  // orientation via insertPage/deletePage dance — jsPDF lets us just call
  // addPage and drop the initial blank page via doc.deletePage when needed; to
  // keep things simple the caller for the first stop opens the jsPDF with the
  // correct orientation already.
  const renderStopPages = async (doc, stop, totalStops, addFirstPage, orientation = 'landscape') => {
    const isPortrait = orientation === 'portrait';
    if (addFirstPage) doc.addPage('a6', isPortrait ? 'portrait' : 'landscape');

    // Page dimensions depend on orientation.
    const W = isPortrait ? 105 : 148;
    const H = isPortrait ? 148 : 105;

    // --- PAGE 1 (front): mirror the editor's front view ---
    // Single source of truth for the front image: `postcardFrontUrlFor` honors
    // stop.postcard.artAssetId first, heroAssetId second. Matches editor + mini.
    const pickFront = (typeof window.postcardFrontUrlFor === 'function')
      ? window.postcardFrontUrlFor
      : ((stop, assets) => heroUrlFor(stop, assets));
    const frontUrl = pickFront(stop, assets);
    const frontRaw = await imageToDataUrl(frontUrl);

    // Mode-specific layout, matching PostcardFrontView in postcard-editor.jsx:
    //   fashion (landscape): 2fr text | 3fr image — cream paper
    //   fashion (portrait):  3fr image / 2fr text (stacked)
    //   punk: full-bleed image + "GREETINGS FROM X" overlay + corner tape
    //   cinema: full-bleed image + letterbox bars + subtitle
    const activeMode = mode || project.defaultMode || 'fashion';
    const titleWord = (stop.title || '').split(' ').slice(0, 2).join(' ');
    const punkTag = (() => {
      const code = (stop.code || '').split(' ')[0];
      if (code && code.length <= 6) return code;
      const firstWord = (stop.label || 'HERE').split('·')[0].trim().split(' ')[0];
      return (firstWord || 'HERE').slice(0, 8);
    })();
    const greetingWord = (stop.label || stop.title || 'HERE')
      .split('·')[0].trim().toUpperCase().split(' ')[0];

    if (activeMode === 'fashion') {
      // Cream background across the whole page first.
      doc.setFillColor(250, 242, 226);
      doc.rect(0, 0, W, H, 'F');

      if (isPortrait) {
        // Top 60% image, bottom 40% text.
        const imgH = Math.round(H * 0.6);
        const frontData = await coverCrop(frontRaw, W, imgH);
        if (frontData) {
          try { doc.addImage(frontData, 'JPEG', 0, 0, W, imgH, undefined, 'FAST'); }
          catch { try { doc.addImage(frontData, 'PNG', 0, 0, W, imgH, undefined, 'FAST'); } catch {} }
        }
        // LONDON · CODE eyebrow
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(80, 60, 40);
        doc.text(`LONDON · ${stop.code || ''}`, 10, imgH + 12);
        // Italic title
        doc.setFont('times', 'italic');
        doc.setFontSize(22);
        doc.setTextColor(32, 20, 16);
        const tLines = doc.splitTextToSize(titleWord, W - 20);
        doc.text(tLines.slice(0, 2), 10, imgH + 26);
        // Edition footer
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 100, 80);
        doc.text(`ED. 01 / ${stop.n} OF ${totalStops}`, 10, H - 10);
      } else {
        // Left 40% text, right 60% image.
        const textW = Math.round(W * 0.4);
        const imgW = W - textW;
        const frontData = await coverCrop(frontRaw, imgW, H);
        if (frontData) {
          try { doc.addImage(frontData, 'JPEG', textW, 0, imgW, H, undefined, 'FAST'); }
          catch { try { doc.addImage(frontData, 'PNG', textW, 0, imgW, H, undefined, 'FAST'); } catch {} }
        }
        // LONDON · CODE eyebrow
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(80, 60, 40);
        doc.text(`LONDON · ${stop.code || ''}`, 8, 14);
        // Italic title centered vertically
        doc.setFont('times', 'italic');
        doc.setFontSize(20);
        doc.setTextColor(32, 20, 16);
        const tLines = doc.splitTextToSize(titleWord, textW - 12);
        doc.text(tLines.slice(0, 3), 8, Math.round(H * 0.55));
        // Edition at bottom-left
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 100, 80);
        doc.text(`ED. 01 / ${stop.n} OF ${totalStops}`, 8, H - 10);
      }
    } else if (activeMode === 'punk') {
      // Full-bleed image on black.
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, W, H, 'F');
      const frontData = await coverCrop(frontRaw, W, H);
      if (frontData) {
        try { doc.addImage(frontData, 'JPEG', 0, 0, W, H, undefined, 'FAST'); }
        catch { try { doc.addImage(frontData, 'PNG', 0, 0, W, H, undefined, 'FAST'); } catch {} }
      }
      // Tape tag (red-orange) with rotated text — jsPDF rotation via options.
      doc.setFillColor(184, 54, 10);
      doc.rect(6, 6, 30, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`${punkTag}!!`, 10, 14);
      // Big "Greetings from X" overlay at bottom-left — white text with red shadow.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isPortrait ? 20 : 26);
      // Shadow
      doc.setTextColor(184, 54, 10);
      doc.text('GREETINGS', 10, H - 28);
      doc.text('FROM', 10, H - 18);
      doc.text(greetingWord, 10, H - 8);
      // Main text
      doc.setTextColor(255, 255, 255);
      doc.text('GREETINGS', 9, H - 29);
      doc.text('FROM', 9, H - 19);
      doc.text(greetingWord, 9, H - 9);
    } else {
      // Cinema: dark background, full-bleed image, letterbox bars, subtitle.
      doc.setFillColor(5, 8, 16);
      doc.rect(0, 0, W, H, 'F');
      const frontData = await coverCrop(frontRaw, W, H);
      if (frontData) {
        try { doc.addImage(frontData, 'JPEG', 0, 0, W, H, undefined, 'FAST'); }
        catch { try { doc.addImage(frontData, 'PNG', 0, 0, W, H, undefined, 'FAST'); } catch {} }
      }
      // Top + bottom letterbox bars.
      const barH = 8;
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, W, barH, 'F');
      doc.rect(0, H - barH, W, barH, 'F');
      // SCENE metadata top-left (mono, subtitle-yellow).
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(230, 210, 120);
      doc.text(`SCENE ${stop.n} · ${stop.time || ''}`, 6, barH + 6);
      // Centered subtitle strip near bottom.
      const subText = `— ${stop.mood || ''} · ${stop.time || ''}`;
      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      const subW = doc.getTextWidth(subText) + 8;
      doc.setFillColor(0, 0, 0);
      if (typeof doc.setGState === 'function' && typeof doc.GState === 'function') {
        try { doc.setGState(new doc.GState({ opacity: 0.55 })); } catch {}
      }
      doc.rect((W - subW) / 2, H - barH - 12, subW, 8, 'F');
      if (typeof doc.setGState === 'function' && typeof doc.GState === 'function') {
        try { doc.setGState(new doc.GState({ opacity: 1 })); } catch {}
      }
      doc.setTextColor(230, 210, 120);
      doc.text(subText, W / 2, H - barH - 6, { align: 'center' });
    }

    // --- PAGE 2 (back): message + recipient ---
    doc.addPage('a6', isPortrait ? 'portrait' : 'landscape');

    const postcard = stop.postcard || { message: '', recipient: {} };
    const recipient = postcard.recipient || {};

    doc.setDrawColor(180);
    doc.setLineWidth(0.2);

    if (isPortrait) {
      // Horizontal divider — message on top 3/5, recipient on bottom 2/5.
      const divY = Math.round(H * 0.6);
      doc.line(10, divY, W - 10, divY);

      // Message (top).
      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      const msgLines = doc.splitTextToSize(postcard.message || '', W - 20);
      doc.text(msgLines, 10, 20);

      // Recipient (bottom).
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      const rY = divY + 10;
      doc.text(recipient.name || '', 10, rY);
      doc.text(recipient.line1 || '', 10, rY + 8);
      doc.text(recipient.line2 || '', 10, rY + 16);
      doc.text(recipient.country || '', 10, rY + 24);

      // Stamp box (top-right of recipient block / upper right corner of lower half).
      doc.setDrawColor(120);
      doc.setLineWidth(0.3);
      doc.rect(W - 30, divY + 6, 20, 25);
      doc.setFontSize(6);
      doc.setTextColor(120, 120, 120);
      doc.text('1ST CLASS', W - 28, divY + 14);

      // Meta footer.
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `ED.01 / ${stop.n} of ${totalStops} · ${stop.code || ''} · ${stop.time || ''}`,
        10, H - 5
      );
    } else {
      // Vertical divider at W/2.
      const divX = Math.round(W / 2);
      doc.line(divX, 10, divX, H - 10);

      // Message (left half) — handwriting-ish italic.
      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      const msgLines = doc.splitTextToSize(postcard.message || '', divX - 18);
      doc.text(msgLines, 10, 20);

      // Recipient (right half) — mono.
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      doc.text(recipient.name || '', divX + 6, 30);
      doc.text(recipient.line1 || '', divX + 6, 40);
      doc.text(recipient.line2 || '', divX + 6, 50);
      doc.text(recipient.country || '', divX + 6, 60);

      // Stamp box (top-right).
      doc.setDrawColor(120);
      doc.setLineWidth(0.3);
      doc.rect(W - 28, 15, 20, 25);
      doc.setFontSize(6);
      doc.setTextColor(120, 120, 120);
      doc.text('1ST CLASS', W - 26, 23);

      // Meta footer.
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `ED.01 / ${stop.n} of ${totalStops} · ${stop.code || ''} · ${stop.time || ''}`,
        10, H - 5
      );
    }
  };

  // Download one stop's postcard as a 2-page A6 PDF (portrait or landscape,
  // matched to the hero's orientation).
  const downloadStopPdf = async (stop) => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      setToast('PDF library failed to load; check network');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setToast(`Rendering postcard for stop ${stop.n}…`);
    try {
      // Detect FRONT image orientation BEFORE opening the jsPDF doc — the
      // first page inherits the doc's orientation and we can't change it later.
      const pickFront = (typeof window.postcardFrontUrlFor === 'function')
        ? window.postcardFrontUrlFor
        : ((s, a) => heroUrlFor(s, a));
      const frontUrl = pickFront(stop, assets);
      const orientation = await detectOrientation(frontUrl);
      const doc = new window.jspdf.jsPDF({ orientation, unit: 'mm', format: 'a6' });
      // jsPDF starts with a first blank page; render directly onto it.
      await renderStopPages(doc, stop, stops.length, false, orientation);
      doc.save(`stop-${stop.n}-${slugify(stop.title)}.pdf`);
      setToast(`Downloaded stop ${stop.n}`);
    } catch (e) {
      setToast('PDF export failed: ' + (e.message || e));
    }
    setTimeout(() => setToast(null), 2000);
  };

  // Download all stops as a single multi-page PDF. Each stop's pair of pages
  // follows its own orientation — we preload every hero once (in parallel) to
  // detect orientations before opening jsPDF, then the per-stop addPage() calls
  // pass the right orientation.
  const downloadAllPdf = async (allStops) => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      setToast('PDF library failed to load; check network');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const targets = allStops.filter(s => s.heroAssetId);
    if (targets.length === 0) {
      setToast('No stops with hero images yet');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setToast(`Rendering ${targets.length} postcards…`);
    try {
      // Preload FRONT image orientations in parallel so the first-page
      // orientation is known at jsPDF creation time.
      const pickFront = (typeof window.postcardFrontUrlFor === 'function')
        ? window.postcardFrontUrlFor
        : ((s, a) => heroUrlFor(s, a));
      const orientations = await Promise.all(
        targets.map(s => detectOrientation(pickFront(s, assets)))
      );
      const doc = new window.jspdf.jsPDF({
        orientation: orientations[0] || 'landscape',
        unit: 'mm',
        format: 'a6',
      });
      for (let i = 0; i < targets.length; i++) {
        await renderStopPages(doc, targets[i], allStops.length, i !== 0, orientations[i]);
      }
      doc.save(`${slug || 'project'}-postcards.pdf`);
      setToast('All postcards downloaded');
    } catch (e) {
      setToast('PDF export failed: ' + (e.message || e));
    }
    setTimeout(() => setToast(null), 2000);
  };

  // Convert an image URL to a base64 data URL via canvas. Returns null if the
  // image is cross-origin-blocked (picsum etc. w/o CORS) — caller should fall back.
  const toDataUrl = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    const img = await loadImageSafe(url);
    if (!img) return null;
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0);
      return c.toDataURL('image/jpeg', 0.82);
    } catch (e) {
      return null;
    }
  };

  // Serialise the project body[] into simple HTML paragraphs.
  const bodyToHtml = (body) => {
    if (!Array.isArray(body)) return '';
    return body.map(node => {
      if (!node) return '';
      const t = (node.text || node.value || '').toString();
      const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      if (node.type === 'heading')    return `<h2>${esc(t)}</h2>`;
      if (node.type === 'pullquote')  return `<blockquote>${esc(t)}</blockquote>`;
      if (node.type === 'meta')       return `<p class="meta">${esc(t)}</p>`;
      if (node.type === 'image')      return '';
      if (node.type === 'media')      return '';
      return `<p>${esc(t)}</p>`;
    }).join('\n');
  };

  const handleDownloadHtml = async () => {
    setToast('Building HTML snapshot…');
    const heroUrls = await Promise.all(stops.map(s => toDataUrl(heroUrlFor(s, assets))));
    const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const stopSections = stops.map((s, i) => `
      <section class="stop" id="stop-${s.n}">
        <div class="stop-hdr">
          <span class="n">${s.n}</span>
          <h2>${esc(s.title || '')}</h2>
          <span class="meta">${esc(s.time || '')} · ${esc(s.mood || '')}</span>
        </div>
        ${heroUrls[i] ? `<img class="hero" src="${heroUrls[i]}" alt="${esc(s.title || '')}" />` : '<div class="hero hero-placeholder"></div>'}
        <div class="body">${bodyToHtml(s.body)}</div>
      </section>
    `).join('\n');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(project.title || 'London Cuts')}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root { --ink: #1a1a1a; --bg: #f7f1e6; --muted: #6a5a4a; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px 96px; }
  header.hero { text-align: center; padding: 48px 0 32px; border-bottom: 1px solid rgba(0,0,0,.12); }
  header.hero .eyebrow { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: .25em; text-transform: uppercase; opacity: .65; }
  header.hero h1 { font-size: 52px; line-height: 1.05; margin: 16px 0 8px; letter-spacing: -0.01em; }
  header.hero .byline { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; opacity: .7; }
  section.stop { margin: 64px 0; }
  .stop-hdr { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
  .stop-hdr .n { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; opacity: .55; min-width: 28px; }
  .stop-hdr h2 { font-size: 30px; margin: 0; font-style: italic; letter-spacing: -0.01em; flex: 1; }
  .stop-hdr .meta { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; opacity: .6; }
  img.hero { width: 100%; height: auto; display: block; margin: 0 0 24px; border: 1px solid rgba(0,0,0,.08); }
  .hero-placeholder { width: 100%; aspect-ratio: 3 / 2; background: rgba(0,0,0,.06); margin-bottom: 24px; }
  .body p { margin: 0 0 1em; font-size: 17px; }
  .body h2 { font-size: 22px; margin: 1.5em 0 .5em; }
  .body blockquote { border-left: 3px solid var(--ink); margin: 1.25em 0; padding: .25em 0 .25em 1em; font-style: italic; opacity: .85; }
  .body .meta { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; opacity: .6; }
  footer { text-align: center; padding: 48px 0 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; opacity: .55; }
</style>
</head>
<body>
<div class="wrap">
  <header class="hero">
    <div class="eyebrow">${esc(project.title || '')} · Ed.01</div>
    <h1>${esc(project.title || '')}</h1>
    <div class="byline">by ${esc(project.author || '')} · ${stops.length} stops · ${esc(project.published || 'snapshot')}</div>
  </header>
  ${stopSections}
  <footer>
    Snapshot exported from londoncuts.com/@ana/${esc(slug)} · ${new Date().toISOString().slice(0, 10)}
  </footer>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'project'}-snapshot.html`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('HTML snapshot downloaded');
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <>
      <div className="slideover-scrim" onClick={onClose} />
      <div className="slideover" data-mode={mode}>
        <div className="slideover-hdr">
          <div>
            <div className="eyebrow">Publish — Ed.01</div>
            <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 26, marginTop: 6, lineHeight: 1 }}>
              {project.title}
            </div>
          </div>
          <div className="row gap-12">
            <button className="btn" onClick={onClose}>Back to workspace</button>
            <button
              className="btn btn-solid"
              disabled={blockers.length > 0 && visibility === 'public'}
              onClick={handlePublish}
              style={{ opacity: (blockers.length > 0 && visibility === 'public') ? 0.5 : 1 }}
            >
              {visibility === 'public'
                ? (blockers.length === 0 ? 'Publish →' : `${blockers.length} issues block publish`)
                : `Save as ${visibility}`}
            </button>
          </div>
        </div>

        <div className="slideover-body">
          <div className="slideover-col">
            <div className="publish-help" data-open={helpOpen}>
              <button
                type="button"
                className="publish-help-toggle"
                onClick={() => setHelpOpen(o => !o)}
                aria-expanded={helpOpen}
              >
                <span className="mono-sm" style={{ letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8 }}>
                  What gets published?
                </span>
                <span style={{ opacity: 0.6, fontFamily: 'var(--f-mono)', fontSize: 12 }}>
                  {helpOpen ? '– hide' : '+ show'}
                </span>
              </button>
              {helpOpen && (
                <div className="publish-help-body mono-sm">
                  <div>
                    <strong>Required per stop:</strong> at least one upload, a hero image, and a non-empty body. Pre-flight below flags anything missing.
                  </div>
                  <div>
                    <strong>What readers see:</strong> a hero section (title + cover), the atlas map with all stops, and a per-stop detail page for each stop (hero · meta · body).
                  </div>
                  <div>
                    <strong>Publishing:</strong> flips <code>visibility</code> to <em>public</em> and stamps a <code>published</code> date on the project. Readers can then visit <span style={{ opacity: 0.75 }}>londoncuts.com/@ana/{slug}</span>.
                  </div>
                </div>
              )}
            </div>

            <div className="eyebrow" style={{ marginTop: 18 }}>Pre-flight · {blockers.length ? `${blockers.length} issues` : 'all clear'}</div>
            <div style={{ marginTop: 12 }}>
              {stops.map(s => {
                const okAll = s.status.upload && s.status.hero && s.status.body;
                const issues = [];
                if (!s.status.upload) issues.push('needs uploads');
                if (!s.status.hero)   issues.push('no hero');
                if (!s.status.body)   issues.push('body empty');
                return (
                  <div key={s.n} className="checklist-item" data-ok={okAll}>
                    <span className="checklist-dot" />
                    <div>
                      <div className="checklist-label">
                        <span className="mono-sm" style={{ opacity: 0.6, marginRight: 8 }}>{s.n}</span>
                        {s.title}
                      </div>
                      {!okAll && (
                        <div className="mono-sm" style={{ opacity: 0.65, marginTop: 2 }}>{issues.join(' · ')}</div>
                      )}
                    </div>
                    <button className="checklist-jump mono-sm" onClick={() => jumpTo(s.n)}>Jump →</button>
                  </div>
                );
              })}
            </div>

            <div className="overline-divider">Settings</div>
            <div className="col gap-12">
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Slug</div>
                <div className="row items-center gap-4 mono-sm" style={{ fontSize: 12 }}>
                  <span style={{ opacity: 0.6 }}>londoncuts.com/@ana/</span>
                  <input value={slug} onChange={e => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase())}
                         style={{ borderBottom: '1px solid currentColor', padding: '2px 4px', minWidth: 180 }} />
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Visibility</div>
                <div className="row gap-8">
                  {['public', 'unlisted', 'private'].map(v => (
                    <button key={v} className={'chip ' + (visibility === v ? 'chip-solid' : '')} onClick={() => setVisibility(v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Default mode for readers</div>
                <ModePill mode={mode} onMode={(m) => storeActions.setMode(m)} />
                <div className="mono-sm" style={{ opacity: 0.5, marginTop: 6 }}>
                  Readers can override client-side.
                </div>
              </div>
            </div>

            <div className="overline-divider">Share</div>
            <div className="col gap-8">
              <button className="btn btn-sm" onClick={handleCopy}>Copy public link</button>
              <button className="btn btn-sm" onClick={handleOpen}>Open in new tab ↗</button>
              <button className="btn btn-sm" onClick={handleDownloadHtml}>Download HTML snapshot</button>
            </div>

            <div className="overline-divider">Print-ready postcards (PDF)</div>
            <div className="col gap-4">
              {stops.filter(s => s.heroAssetId).length === 0 && (
                <div className="mono-sm" style={{ opacity: 0.6 }}>
                  No stops have a hero image yet — set a hero to enable postcard export.
                </div>
              )}
              {stops.filter(s => s.heroAssetId).map(s => (
                <button
                  key={s.n}
                  className="btn btn-sm"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => downloadStopPdf(s)}
                >
                  📄 Stop {s.n} · {s.title}
                </button>
              ))}
              {stops.filter(s => s.heroAssetId).length > 0 && (
                <button
                  className="btn btn-sm btn-solid"
                  style={{ marginTop: 8 }}
                  onClick={() => downloadAllPdf(stops)}
                >
                  Download all (one PDF, {stops.filter(s => s.heroAssetId).length * 2} pages)
                </button>
              )}
            </div>

            {toast && (
              <div className="mono-sm" style={{ marginTop: 12, padding: '6px 10px', border: '1px solid currentColor', display: 'inline-block' }}>
                {toast}
              </div>
            )}
          </div>

          <div className="slideover-col">
            <div className="eyebrow">Live preview · {mode}</div>
            <div style={{
              marginTop: 12, border: '1px solid oklch(from currentColor l c h / 0.2)',
              aspectRatio: '3/4', overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                transform: 'scale(0.42)', transformOrigin: 'top left',
                width: '238%', height: '238%',
                pointerEvents: 'none',
              }}>
                <PublicProjectHeroPreview mode={mode} />
              </div>
            </div>
            <div className="mono-sm" style={{ opacity: 0.55, marginTop: 8 }}>
              Reflects current workspace state · updates as you edit.
            </div>

            <div className="overline-divider">Summary</div>
            <table className="token-table" style={{ marginTop: 0 }}>
              <tbody>
                <tr><td>Stops</td><td>{summary.total}</td></tr>
                <tr><td>Ready</td><td>{summary.totalComplete}</td></tr>
                <tr><td>Missing heroes</td><td>{summary.missingHeroes}</td></tr>
                <tr><td>Missing bodies</td><td>{summary.missingBodies}</td></tr>
                <tr><td>Default mode</td><td>{mode}</td></tr>
                <tr><td>Visibility</td><td>{visibility}</td></tr>
                <tr><td>Published</td><td>{project.published || '—'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function PublicProjectHeroPreview({ mode }) {
  const project = useLCStore(s => s.project);
  const stops = useLCStore(s => s.stops);
  const assets = useLCStore(s => s.assetsPool);
  const coverStop = stops.find(s => s.heroAssetId) || stops[0];
  // Use the postcard front URL so the preview reflects the user's chosen AI art.
  const heroUrl = (typeof window.postcardFrontUrlFor === 'function')
    ? window.postcardFrontUrlFor(coverStop, assets)
    : heroUrlFor(coverStop, assets);
  return (
    <div className="page" data-mode={mode} style={{ minHeight: 0 }}>
      <div className="pp-hero" style={{ minHeight: 760 }}>
        <div className="pp-hero-txt">
          <div>
            <div className="eyebrow">{project.title} · Ed.01 · by {project.author}</div>
            <h1 style={{ fontFamily: 'var(--mode-display-font)', fontSize: 92, lineHeight: 0.9, marginTop: 24, letterSpacing: '-0.02em' }}>
              {project.title || 'London'}
            </h1>
          </div>
          <div className="mono-sm" style={{ opacity: 0.65 }}>
            {stops.length} STOPS · 48 MIN READ · ED.01 · {project.published || 'APR 2026'}
          </div>
        </div>
        <div className="pp-hero-img">
          {heroUrl
            ? <img src={heroUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <Img label={project.coverLabel} tone={mode === 'cinema' ? 'dark' : 'warm'} style={{ height: '100%', aspectRatio: 'auto' }} />
          }
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PublishSlideover });
