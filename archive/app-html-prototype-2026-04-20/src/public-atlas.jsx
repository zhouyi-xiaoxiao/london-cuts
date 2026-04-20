// public-atlas.jsx — Real map renderer with a 3-tier fallback chain:
//   1. MapLibre GL (primary) — WebGL vector/raster, styled per mode.
//   2. Leaflet (safety net) — plain <img> raster tiles, works without WebGL.
//   3. SVG schematic (last resort) — no network, always renders.
// The active renderer is shown in a small badge in the bottom-left so it's
// obvious in the field which path took effect.

// ---- Stop coord helper ------------------------------------------------------
// Returns the list of stops that currently have usable lat/lng values. The
// seed-demo can replace window.STOPS / the LCStore stops with photos spread
// across London (Heathrow, Windsor, Canary Wharf, etc.), so we always re-read.
const getStopsWithCoords = () => {
  const stops = (typeof window !== 'undefined' ? window.LCStore?.getState?.()?.stops : null) || window.STOPS || [];
  return stops.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number');
};

// ---- Mode-aware style skeletons --------------------------------------------
// We keep to raster OSM tiles (no token) and steer the vibe via raster paint
// props. The V2 brief asks for three distinct map worlds — this is a first
// pass we can hand to Claude Design as the starting point.
const TILES = {
  voyager: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  dark:    'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
};
// Provider fallback chain: try primary (Carto voyager) first, then OSM direct,
// then SVG as absolute last resort. Each entry is a function that returns a
// full tiles URL pattern for a given mode's light/dark preference. All entries
// use HTTPS so they work both on localhost and through Cloudflare tunnels.
const TILE_PROVIDERS = [
  { id: 'carto',     light: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', dark: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', attr: '© OpenStreetMap © CARTO' },
  { id: 'osm',       light: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',                    dark: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',         attr: '© OpenStreetMap contributors' },
];
const ATTR = '© OpenStreetMap © CARTO';

function buildMapStyle(mode, providerIdx = 0) {
  const provider = TILE_PROVIDERS[Math.min(providerIdx, TILE_PROVIDERS.length - 1)];
  const lightUrl = provider.light;
  const darkUrl = provider.dark;
  const attr = provider.attr;
  if (mode === 'cinema') {
    // Three-pass cinema — deep navy/black base, cyan-blue hue-shift, vignette.
    // Targets a film-still dark, HIGH-contrast moody feel.
    return {
      version: 8,
      sources: {
        t: { type: 'raster', tiles: [darkUrl], tileSize: 256, attribution: attr },
        // A second copy of the raster for a vignette-style overlay (darker, lower opacity)
        v: { type: 'raster', tiles: [darkUrl], tileSize: 256 },
        // A third copy tinted cyan for the "digital/neo" highlight pass
        h: { type: 'raster', tiles: [darkUrl], tileSize: 256 },
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#050a18' } },
        // Pass 1: heavily darkened tiles, strong hue-shift toward cyan-blue
        { id: 't', type: 'raster', source: 't', paint: {
          'raster-saturation': -0.6,
          'raster-hue-rotate': 210,
          'raster-brightness-min': 0.0,
          'raster-brightness-max': 0.35,
          'raster-contrast': 0.45,
          'raster-opacity': 0.92,
        } },
        // Pass 2: cyan highlight — solid deep-navy background color scrim
        { id: 'cyan-tint', type: 'background', paint: {
          'background-color': '#0a2040',
          'background-opacity': 0.25,
        } },
        // Pass 3: vignette — darker second pass with lower opacity for depth
        { id: 'v', type: 'raster', source: 'v', paint: {
          'raster-saturation': -1,
          'raster-brightness-min': 0.0,
          'raster-brightness-max': 0.15,
          'raster-contrast': 0.4,
          'raster-opacity': 0.28,
        } },
        // Subtle cyan rim from a third raster pass, very low opacity
        { id: 'h', type: 'raster', source: 'h', paint: {
          'raster-saturation': 0.5,
          'raster-hue-rotate': 190,
          'raster-brightness-min': 0.2,
          'raster-brightness-max': 0.65,
          'raster-contrast': 0.15,
          'raster-opacity': 0.1,
        } },
      ],
    };
  }
  if (mode === 'punk') {
    // Three-pass punk — push toward 3-color zine palette: black + white + red.
    // Base raster goes full desat + high contrast to pure B&W, then a red scrim.
    return {
      version: 8,
      sources: {
        t: { type: 'raster', tiles: [lightUrl], tileSize: 256, attribution: attr },
        // Duotone tint pass — same tiles, warm hue-shift to push red-orange
        r: { type: 'raster', tiles: [lightUrl], tileSize: 256 },
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#f4f0e6' } },
        // Pass 1: full desaturate + extreme contrast for near-B&W xerox look
        { id: 't', type: 'raster', source: 't', paint: {
          'raster-saturation': -1,
          'raster-contrast': 1.0,
          'raster-brightness-min': 0.0,
          'raster-brightness-max': 1.0,
        } },
        // Pass 2: red-orange duotone tint — boosted saturation at low opacity
        { id: 'r', type: 'raster', source: 'r', paint: {
          'raster-saturation': 1,
          'raster-hue-rotate': 0,
          'raster-brightness-min': 0.3,
          'raster-brightness-max': 0.85,
          'raster-contrast': 0.35,
          'raster-opacity': 0.1,
        } },
        // Pass 3: solid red scrim — the "third color" in the zine palette
        { id: 'scrim', type: 'background', paint: {
          'background-color': '#b8360a',
          'background-opacity': 0.18,
        } },
      ],
    };
  }
  // fashion — cream paper base, heavily desat + warm-shifted tiles (old
  // Michelin / travel guide), bold warm overlay tint at higher opacity.
  return {
    version: 8,
    sources: {
      t: { type: 'raster', tiles: [lightUrl], tileSize: 256, attribution: attr },
      // Second raster pass for a subtle paper-grain / brightness-shift overlay
      p: { type: 'raster', tiles: [lightUrl], tileSize: 256 },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#f0e3cb' } },
      // Pass 1: aggressive desat + warm hue-shift + brightness lift
      { id: 't', type: 'raster', source: 't', paint: {
        'raster-saturation': -0.75,
        'raster-hue-rotate': 30,
        'raster-brightness-min': 0.85,
        'raster-brightness-max': 1.15,
        'raster-contrast': -0.15,
        'raster-opacity': 0.6,
      } },
      // Pass 2: warm terracotta overlay — pushes everything toward oxblood ink
      { id: 'warm', type: 'background', paint: {
        'background-color': '#c97a3c',
        'background-opacity': 0.12,
      } },
      // Pass 3: paper grain — same tiles at very low opacity, warmed further
      { id: 'p', type: 'raster', source: 'p', paint: {
        'raster-saturation': -0.9,
        'raster-hue-rotate': 20,
        'raster-brightness-min': 0.9,
        'raster-brightness-max': 1.1,
        'raster-contrast': -0.2,
        'raster-opacity': 0.15,
      } },
    ],
  };
}

// ---- Lazy loader for maplibre-gl -------------------------------------------
// Returns { loaded, failed }. `failed` flips to true only after a true
// failure: 10s elapsed with no `window.maplibregl` global present. Callers can
// use `failed` to decide whether to show the SVG fallback; a still-pending
// load (loaded=false, failed=false) should keep the "loading map…" overlay
// rather than bailing out.
function useMapLibre() {
  const [loaded, setLoaded] = React.useState(() => !!window.maplibregl);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    if (loaded) return;

    if (!document.querySelector('link[data-maplibre]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.css';
      l.setAttribute('data-maplibre', '1');
      document.head.appendChild(l);
    }

    let s = document.querySelector('script[data-maplibre]');
    if (!s) {
      s = document.createElement('script');
      s.src = 'https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.js';
      s.async = true;
      s.setAttribute('data-maplibre', '1');
      document.head.appendChild(s);
    }
    const poll = setInterval(() => {
      if (window.maplibregl) { setLoaded(true); clearInterval(poll); }
    }, 80);
    // True-failure timer: 10s with no maplibregl means the CDN is unreachable.
    const failTimer = setTimeout(() => {
      if (!window.maplibregl) setFailed(true);
    }, 10000);
    return () => { clearInterval(poll); clearTimeout(failTimer); };
  }, [loaded]);
  return { loaded, failed };
}

// ---- Lazy loader for Leaflet ------------------------------------------------
// Inject the CSS and script tags from the CDN on demand; nothing is added to
// index.html. Returns { loaded, failed } with the same contract as useMapLibre.
// We only kick off the load when the caller asks for it (the `enabled` flag).
function useLeaflet(enabled) {
  const [loaded, setLoaded] = React.useState(() => !!window.L);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    if (!enabled) return;
    if (loaded) return;

    if (!document.querySelector('link[data-leaflet]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      l.setAttribute('data-leaflet', '1');
      document.head.appendChild(l);
    }

    let s = document.querySelector('script[data-leaflet]');
    if (!s) {
      s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.async = true;
      s.setAttribute('data-leaflet', '1');
      document.head.appendChild(s);
    }
    const poll = setInterval(() => {
      if (window.L) { setLoaded(true); clearInterval(poll); }
    }, 80);
    const failTimer = setTimeout(() => {
      if (!window.L) setFailed(true);
    }, 10000);
    return () => { clearInterval(poll); clearTimeout(failTimer); };
  }, [enabled, loaded]);
  return { loaded, failed };
}

// ---- Decorative SVG fallback (no tiles) ------------------------------------
// Projects the current set of stops onto an 800×500 viewBox. The bounding box
// is computed from the stops themselves, so whether they're tight in SE1 or
// scattered across Greater London the projection still fits.
function AtlasSvgFallback({ mode, onStopClick, stopsSignature }) {
  // stopsSignature is unused here except to signal a re-render when stops
  // change; we always read fresh coords on render.
  void stopsSignature;
  const stops = getStopsWithCoords();
  const W = 800, H = 500, M = 60;

  const lngs = stops.map(s => s.lng);
  const lats = stops.map(s => s.lat);
  const minLng = lngs.length ? Math.min(...lngs) : -0.2;
  const maxLng = lngs.length ? Math.max(...lngs) : 0.0;
  const minLat = lats.length ? Math.min(...lats) : 51.45;
  const maxLat = lats.length ? Math.max(...lats) : 51.55;
  // If all coords collapse to a single point, pad the bbox so the projection
  // doesn't divide by zero and everything lands at top-left.
  const lngSpan = (maxLng - minLng) || 0.01;
  const latSpan = (maxLat - minLat) || 0.01;
  const project = (lng, lat) => {
    const x = M + ((lng - minLng) / lngSpan) * (W - 2 * M);
    const y = M + (1 - (lat - minLat) / latSpan) * (H - 2 * M);
    return { x, y };
  };

  const palette = mode === 'cinema'
    ? { bg: '#04060f', ink: '#e6d27a', river: '#1a2a42', stroke: '#203050', dotFill: '#0a0e1c', dotRing: '#e6d27a', label: '#e6d27a' }
    : mode === 'punk'
      ? { bg: '#f4f1e8', ink: '#1a1a1a', river: '#d9d3c2', stroke: '#1a1a1a', dotFill: '#fff', dotRing: '#b8360a', label: '#1a1a1a' }
      : { bg: '#f7f1e6', ink: '#5a2a2a', river: '#d8cdb8', stroke: '#8a6a52', dotFill: '#fff8ec', dotRing: '#8a3a2a', label: '#3a2a1a' };

  // Stylised Thames curve — a scaled S that runs roughly east-west across the
  // middle of the viewBox. It's decorative; no geographic accuracy claimed.
  const thamesD = `M ${M - 30},${H * 0.55} C ${W * 0.2},${H * 0.35} ${W * 0.4},${H * 0.25} ${W * 0.55},${H * 0.4} S ${W * 0.9},${H * 0.7} ${W + 30},${H * 0.55}`;

  return (
    <div className="atlas-svg-fallback" data-mode={mode} style={{ width: '100%', height: '100%', background: palette.bg }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <filter id="atlas-fallback-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* River */}
        <path d={thamesD} stroke={palette.river} strokeWidth="42" strokeLinecap="round" fill="none" opacity="0.75" />
        <path d={thamesD} stroke={palette.stroke} strokeWidth="1.5" fill="none" opacity="0.35" strokeDasharray="4 4" />
        <text x={W * 0.1} y={H * 0.42} fontFamily="serif" fontStyle="italic" fontSize="18" fill={palette.ink} opacity="0.6">Thames</text>

        {/* Stops — projected from their own lat/lng */}
        {stops.map(s => {
          const { x, y } = project(s.lng, s.lat);
          return (
            <g key={s.n} style={{ cursor: onStopClick ? 'pointer' : 'default' }} onClick={() => onStopClick && onStopClick(s)}>
              <circle cx={x} cy={y} r="14" fill={palette.dotFill} stroke={palette.dotRing} strokeWidth="2.5" filter={mode === 'cinema' ? 'url(#atlas-fallback-glow)' : undefined} />
              <text x={x} y={y + 4} textAnchor="middle" fontFamily="monospace" fontSize="11" fontWeight="700" fill={palette.label}>{s.n}</text>
            </g>
          );
        })}

        <text x={M} y={H - 18} fontFamily="monospace" fontSize="10" fill={palette.ink} opacity="0.55">
          offline atlas · {stops.length} stops
        </text>
      </svg>
    </div>
  );
}

// ---- The map component -----------------------------------------------------
// Renderer state machine:
//   'maplibre' → trying MapLibre (primary). Flips to 'leaflet' if no tile has
//                rendered in 10s or MapLibre surfaces an unrecoverable error.
//   'leaflet'  → Leaflet raster tiles. Flips to 'svg' if Leaflet CDN fails OR
//                its own tile-success watchdog (12s) trips.
//   'svg'      → Offline schematic. Terminal state.
function StopAtlas({ mode, onStopClick, paletteColors }) {
  const containerRef = React.useRef(null);
  const leafletContainerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const leafletMapRef = React.useRef(null);
  const leafletMarkersRef = React.useRef([]);
  const markersRef = React.useRef([]);
  const clustersRef = React.useRef([]);
  const [hover, setHover] = React.useState(null);
  const [clusters, setClusters] = React.useState([]);
  // Which renderer is currently mounted. Drives both rendering and the badge.
  const [renderer, setRenderer] = React.useState('maplibre');
  const { loaded: libLoaded, failed: libFailed } = useMapLibre();
  // Kick Leaflet loading as soon as we switch to that renderer.
  const { loaded: leafletLoaded, failed: leafletFailed } = useLeaflet(renderer === 'leaflet');
  // Tile-provider retry tracker. 0 = carto primary, 1 = osm, 2+ = exhausted.
  const providerIdxRef = React.useRef(0);
  // Flips to true the first time a tile successfully loads. Once true, the
  // SVG fallback watchdog is cancelled forever for this mount — the real map
  // is working, so markers-not-yet-placed is NOT a fallback condition.
  const tileEverLoadedRef = React.useRef(false);
  // Counts the number of tile fetches the browser has initiated from our
  // providers. If this is still 0 after 12s, we treat the map as DOA.
  const tileFetchCountRef = React.useRef(0);
  // Debounce guard so one style-load failure can't chew through the whole
  // provider chain in a single tick.
  const providerSwapInFlightRef = React.useRef(false);

  // Convenience: any renderer past MapLibre counts as "MapLibre gave up".
  const mlGaveUp = renderer !== 'maplibre';

  // Signature that changes whenever the set of stops, or any stop's coords,
  // changes. Drives marker re-render + SVG fallback re-render.
  const [stopsSignature, setStopsSignature] = React.useState(() =>
    getStopsWithCoords().map(s => s.n + ':' + s.lat + ',' + s.lng).join('|')
  );

  // Re-read the store on a light interval so seed-demo loading → atlas update
  // is automatic. Store has no subscribe contract we can rely on here, so a
  // tiny poll is the pragmatic choice.
  React.useEffect(() => {
    const tick = () => {
      const sig = getStopsWithCoords().map(s => s.n + ':' + s.lat + ',' + s.lng).join('|');
      setStopsSignature(prev => (prev === sig ? prev : sig));
    };
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  // Helper: build hover card content with hero image or tone swatch
  const buildHoverCard = (stop) => {
    let heroImg = null;
    try {
      const state = window.LCStore?.getState?.();
      const stopData = state?.stops?.find(s => s.n === stop.n);
      if (stopData?.heroAssetId) {
        const asset = state.assetsPool?.find(a => a.id === stopData.heroAssetId);
        if (asset?.imageUrl) heroImg = asset.imageUrl;
      }
      if (!heroImg) heroImg = window.STOP_IMAGES?.[stop.n] || null;
      // live-read the freshest title/time for the hover card
      if (stopData) {
        stop = { ...stop, title: stopData.title, time: stopData.time, label: stopData.label, code: stopData.code };
      }
    } catch (e) {}

    const card = document.createElement('div');
    card.className = 'atlas-hover-card';
    card.dataset.mode = mode;

    // Stop number badge
    const badge = document.createElement('div');
    badge.className = 'atlas-hover-badge';
    badge.textContent = stop.n;
    card.appendChild(badge);

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'atlas-hover-thumb';
    if (heroImg) {
      thumb.style.backgroundImage = `url(${heroImg})`;
      thumb.style.backgroundSize = 'cover';
      thumb.style.backgroundPosition = 'center';
    } else {
      const toneColor = stop.tone || 'warm';
      thumb.dataset.tone = toneColor;
      thumb.className = 'atlas-hover-thumb atlas-hover-thumb-swatch';
    }
    card.appendChild(thumb);

    // Title
    const title = document.createElement('div');
    title.className = 'atlas-hover-title';
    title.textContent = stop.title;
    card.appendChild(title);

    // Meta
    const meta = document.createElement('div');
    meta.className = 'atlas-hover-meta mono-sm';
    meta.textContent = (stop.label || stop.code || 'SE1') + (stop.time ? ' · ' + stop.time : '');
    card.appendChild(meta);

    return card;
  };

  // Helper: compute cluster bounds
  const getClusterBounds = (cluster) => {
    const coords = cluster.stops
      .filter(s => typeof s.lat === 'number' && typeof s.lng === 'number');
    if (!coords.length) return null;
    const bounds = new window.maplibregl.LngLatBounds();
    coords.forEach(s => bounds.extend([s.lng, s.lat]));
    return bounds;
  };

  // Helper: update clusters on zoom/pan (MapLibre only)
  const updateClusters = () => {
    if (!mapRef.current || !mapRef.current.loaded()) return;

    clustersRef.current.forEach(m => m.remove());
    clustersRef.current = [];
    setClusters([]);

    const stops = getStopsWithCoords();
    const projections = stops.map(s => ({
      stop: s,
      screen: mapRef.current.project([s.lng, s.lat]),
    }));

    const placed = new Set();
    const newClusters = [];

    for (const { stop, screen } of projections) {
      if (placed.has(stop.n)) continue;

      let foundCluster = false;
      for (const cluster of newClusters) {
        const clusterScreens = cluster.stops.map(s => mapRef.current.project([s.lng, s.lat]));
        const minDist = Math.min(
          ...clusterScreens.map(cs =>
            Math.hypot(screen.x - cs.x, screen.y - cs.y)
          )
        );
        if (minDist < 40) {
          cluster.stops.push(stop);
          placed.add(stop.n);
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        newClusters.push({ stops: [stop], screen });
        placed.add(stop.n);
      }
    }

    newClusters.forEach(cluster => {
      if (cluster.stops.length < 2) return;

      const clusterScreen = cluster.stops.reduce(
        (acc, s) => {
          const proj = mapRef.current.project([s.lng, s.lat]);
          return { x: acc.x + proj.x, y: acc.y + proj.y };
        },
        { x: 0, y: 0 }
      );
      clusterScreen.x /= cluster.stops.length;
      clusterScreen.y /= cluster.stops.length;

      const clusterEl = document.createElement('div');
      clusterEl.className = 'atlas-cluster';
      clusterEl.dataset.mode = mode;
      clusterEl.innerHTML = `<span class="atlas-cluster-count">${cluster.stops.length}</span><span class="atlas-cluster-label">stops</span>`;
      clusterEl.style.position = 'absolute';
      clusterEl.style.transform = `translate(calc(-50% + ${clusterScreen.x}px), calc(-50% + ${clusterScreen.y}px))`;
      clusterEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const bounds = getClusterBounds(cluster);
        if (bounds) {
          const currentZoom = mapRef.current.getZoom();
          const targetZoom = Math.min(currentZoom + 2, 15);
          mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: targetZoom, duration: 600 });
        }
      });

      containerRef.current.appendChild(clusterEl);
      clustersRef.current.push({ remove: () => clusterEl.remove() });
    });

    setClusters(newClusters);
  };

  // MapLibre library-load failure → jump to Leaflet (not SVG). Leaflet is the
  // designed safety net; SVG is reserved for "even Leaflet couldn't boot".
  React.useEffect(() => {
    if (libFailed && renderer === 'maplibre') setRenderer('leaflet');
  }, [libFailed, renderer]);

  // Leaflet library-load failure → SVG. Terminal.
  React.useEffect(() => {
    if (leafletFailed && renderer === 'leaflet') setRenderer('svg');
  }, [leafletFailed, renderer]);

  // Add (or re-add) markers for the current set of stops + fit the camera to
  // them. Split out so we can call it on first load and whenever stops change.
  const renderMarkers = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear any existing markers
    markersRef.current.forEach(m => { try { m.remove(); } catch {} });
    markersRef.current = [];

    const stops = getStopsWithCoords();
    stops.forEach((stop) => {
      const el = document.createElement('div');
      el.className = 'atlas-marker';
      el.dataset.mode = mode;
      el.innerHTML = '<span class="atlas-marker-n">' + stop.n + '</span>';

      const hoverCard = buildHoverCard(stop);
      let popupShown = false;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        map.flyTo({ center: [stop.lng, stop.lat], zoom: 15.5, duration: 600, essential: true });
        map.once('moveend', () => {
          if (onStopClick) onStopClick(stop);
        });
      });

      el.addEventListener('mouseenter', () => {
        if (!popupShown) {
          hoverCard.style.position = 'absolute';
          hoverCard.style.bottom = '100%';
          hoverCard.style.left = '50%';
          hoverCard.style.transform = 'translateX(-50%)';
          hoverCard.style.marginBottom = '12px';
          hoverCard.style.zIndex = '20';
          el.appendChild(hoverCard);
          popupShown = true;
        }
      });

      el.addEventListener('mouseleave', () => {
        if (popupShown && hoverCard.parentNode) {
          hoverCard.parentNode.removeChild(hoverCard);
          popupShown = false;
        }
      });

      const marker = new window.maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Fit camera to whatever stops we actually have
    if (stops.length) {
      const bounds = new window.maplibregl.LngLatBounds();
      stops.forEach(s => bounds.extend([s.lng, s.lat]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: { top: 60, right: 40, bottom: 100, left: 40 }, maxZoom: 15, duration: 0 });
      }
    }
  }, [mode, onStopClick]);

  // Leaflet marker renderer. Uses L.divIcon so we can re-use the existing
  // .atlas-marker CSS — the marker element visuals are identical to MapLibre's.
  const renderLeafletMarkers = React.useCallback(() => {
    const map = leafletMapRef.current;
    if (!map || !window.L) return;

    leafletMarkersRef.current.forEach(m => { try { m.remove(); } catch {} });
    leafletMarkersRef.current = [];

    const stops = getStopsWithCoords();
    stops.forEach((stop) => {
      const icon = window.L.divIcon({
        className: 'atlas-marker-leaflet-wrap',
        html: `<div class="atlas-marker" data-mode="${mode}"><span class="atlas-marker-n">${stop.n}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = window.L.marker([stop.lat, stop.lng], { icon })
        .addTo(map)
        .on('click', () => {
          map.setView([stop.lat, stop.lng], Math.max(map.getZoom(), 14), { animate: true });
          if (onStopClick) setTimeout(() => onStopClick(stop), 300);
        });
      leafletMarkersRef.current.push(marker);
    });

    if (stops.length) {
      const bounds = window.L.latLngBounds(stops.map(s => [s.lat, s.lng]));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [mode, onStopClick]);

  // Initialize MapLibre once library is ready
  React.useEffect(() => {
    if (renderer !== 'maplibre') return;
    if (!libLoaded || !containerRef.current || mapRef.current) return;

    // Pick an initial centre from whatever stops we have; fall back to a
    // Greater-London-ish centre if nothing's loaded yet.
    const initialStops = getStopsWithCoords();
    let center = [-0.1276, 51.5074]; // central London
    if (initialStops.length) {
      const avgLng = initialStops.reduce((a, s) => a + s.lng, 0) / initialStops.length;
      const avgLat = initialStops.reduce((a, s) => a + s.lat, 0) / initialStops.length;
      center = [avgLng, avgLat];
    }

    // Reset per-mount state
    providerIdxRef.current = 0;
    tileEverLoadedRef.current = false;
    tileFetchCountRef.current = 0;
    providerSwapInFlightRef.current = false;

    let map;
    try {
      map = new window.maplibregl.Map({
        container: containerRef.current,
        style: buildMapStyle(mode, providerIdxRef.current),
        center,
        zoom: 12,
        minZoom: 10,
        maxZoom: 18,
        attributionControl: false,
        // Fetch-intercept: transformRequest runs for every resource the map
        // requests. We use it to count tile fetches so we can distinguish
        // "network broken, zero tiles ever requested" (→ fallback) from "tiles
        // in flight, just slow" (→ keep waiting).
        transformRequest: (url, resourceType) => {
          if (resourceType === 'Tile') tileFetchCountRef.current += 1;
          return { url };
        },
      });
    } catch (err) {
      // Constructor itself threw (e.g. WebGL unavailable). Straight to Leaflet.
      setRenderer('leaflet');
      return;
    }
    map.addControl(new window.maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'bottom-right');
    mapRef.current = map;

    // Deterministic markers trigger: 'idle' fires when the style + all tiles have
    // finished loading and there's no render queued. 'load' is less reliable in some
    // browser/extension combos — 'idle' always fires. Guard against double-add.
    const tryAddMarkers = () => {
      if (markersRef.current.length === 0 && mapRef.current) renderMarkers();
    };
    map.once('idle', tryAddMarkers);
    map.once('load', tryAddMarkers);
    // Belt & braces marker trigger — 'idle' can be delayed on slow tile servers.
    // This is ONLY about placing markers; it never triggers the SVG fallback.
    const markerRetryTimer = setTimeout(tryAddMarkers, 2500);

    // Tile success tracker. We listen for 'data' with dataType 'source' — this
    // fires per successful tile load. Checking only sourceId === 't' covers both
    // light and cinema modes (the main tile source is always named 't').
    let hardFailTimer = null;
    const onData = (e) => {
      if (e && e.dataType === 'source' && e.tile && e.sourceId === 't') {
        if (!tileEverLoadedRef.current) {
          tileEverLoadedRef.current = true;
          // Real tiles rendered — cancel both watchdogs forever for this mount.
          if (noTileWatchdog) { clearTimeout(noTileWatchdog); noTileWatchdog = null; }
          if (hardFailTimer) { clearTimeout(hardFailTimer); hardFailTimer = null; }
        }
      }
    };
    // True-error handler: style-load or source-load failures cascade through
    // the provider chain. Generic tile HTTP errors (404, CORS) also count.
    const onMapError = (e) => {
      const msg = (e && (e.error?.message || e.message || '')).toString().toLowerCase();
      const isTileOrSource = msg.includes('tile') || msg.includes('source') || msg.includes('style') || (e && e.sourceId === 't');
      if (!isTileOrSource) return;
      // Already on a working map? ignore transient errors.
      if (tileEverLoadedRef.current) return;
      // Debounce: ignore error bursts while a previous swap is still settling.
      if (providerSwapInFlightRef.current) return;
      if (providerIdxRef.current < TILE_PROVIDERS.length - 1) {
        providerIdxRef.current += 1;
        providerSwapInFlightRef.current = true;
        try {
          if (mapRef.current) {
            mapRef.current.setStyle(buildMapStyle(mode, providerIdxRef.current));
            // Release the debounce after the new style reaches 'idle'. If idle
            // never fires (the new provider is also broken), the hard-fail timer
            // below takes over.
            mapRef.current.once('idle', () => { providerSwapInFlightRef.current = false; });
          }
        } catch {
          providerSwapInFlightRef.current = false;
        }
      } else {
        // Exhausted the MapLibre provider chain — escalate to Leaflet.
        setRenderer('leaflet');
      }
    };
    map.on('data', onData);
    map.on('error', onMapError);

    // "No tiles fetched at all" watchdog: if 10s pass and not a single tile
    // has even been requested, something is very wrong (CSP block, no network
    // to any provider). Escalate to Leaflet. We do NOT require the tile to
    // have rendered here — just that the browser tried to fetch one.
    let noTileWatchdog = setTimeout(() => {
      if (!mapRef.current) return;
      if (tileEverLoadedRef.current) return;
      if (tileFetchCountRef.current === 0) setRenderer('leaflet');
    }, 10000);

    // Hard-fail watchdog: even if tiles were requested, if NONE have actually
    // rendered in 10s we also bail to Leaflet. This is the case we missed
    // before — requests sent, all 404/CORS-blocked, map stays blank forever.
    hardFailTimer = setTimeout(() => {
      if (!mapRef.current) return;
      if (tileEverLoadedRef.current) return;
      setRenderer('leaflet');
    }, 10000);

    const handleMapChange = () => {
      setTimeout(updateClusters, 50);
    };
    map.on('zoom', handleMapChange);
    map.on('zoomend', handleMapChange);
    map.on('move', handleMapChange);

    return () => {
      clearTimeout(markerRetryTimer);
      if (noTileWatchdog) clearTimeout(noTileWatchdog);
      if (hardFailTimer) clearTimeout(hardFailTimer);
      map.off('data', onData);
      map.off('error', onMapError);
      map.off('zoom', handleMapChange);
      map.off('zoomend', handleMapChange);
      map.off('move', handleMapChange);
      clustersRef.current.forEach(c => c.remove?.());
      clustersRef.current = [];
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, [libLoaded, renderer]);

  // Initialize Leaflet when the renderer flips to it.
  React.useEffect(() => {
    if (renderer !== 'leaflet') return;
    if (!leafletLoaded || !leafletContainerRef.current || leafletMapRef.current) return;

    const initialStops = getStopsWithCoords();
    let center = [51.5074, -0.1276];
    if (initialStops.length) {
      const avgLat = initialStops.reduce((a, s) => a + s.lat, 0) / initialStops.length;
      const avgLng = initialStops.reduce((a, s) => a + s.lng, 0) / initialStops.length;
      center = [avgLat, avgLng];
    }

    let map;
    try {
      map = window.L.map(leafletContainerRef.current, {
        center,
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });
    } catch (err) {
      setRenderer('svg');
      return;
    }
    leafletMapRef.current = map;

    // Tile-success tracker for Leaflet. If no tile 'load' fires in 12s, bail.
    let leafletTileLoaded = false;
    let leafletWatchdog = setTimeout(() => {
      if (!leafletTileLoaded) setRenderer('svg');
    }, 12000);

    const tileLayer = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);
    tileLayer.on('load', () => {
      leafletTileLoaded = true;
      if (leafletWatchdog) { clearTimeout(leafletWatchdog); leafletWatchdog = null; }
    });
    tileLayer.on('tileerror', () => {
      // Don't bail on a single tile error — some tiles always 404 at edges.
      // The 12s no-load watchdog catches a fully-broken provider.
    });

    renderLeafletMarkers();

    return () => {
      if (leafletWatchdog) clearTimeout(leafletWatchdog);
      leafletMarkersRef.current.forEach(m => { try { m.remove(); } catch {} });
      leafletMarkersRef.current = [];
      if (leafletMapRef.current) {
        try { leafletMapRef.current.remove(); } catch {}
        leafletMapRef.current = null;
      }
    };
  }, [renderer, leafletLoaded, renderLeafletMarkers]);

  // Re-render MapLibre markers when the set of stops (or their coords) changes.
  // This is the hook that lets seed-demo swap in 13 photos across London and
  // have the atlas catch up without a reload.
  React.useEffect(() => {
    if (renderer !== 'maplibre') return;
    if (!mapRef.current) return;
    // Only re-render once the map has a loaded style, otherwise fitBounds fights
    // with the initial idle handler.
    const map = mapRef.current;
    const run = () => renderMarkers();
    if (map.isStyleLoaded()) run();
    else map.once('idle', run);
  }, [stopsSignature, renderer, renderMarkers]);

  // Re-render Leaflet markers when stops change.
  React.useEffect(() => {
    if (renderer !== 'leaflet') return;
    if (!leafletMapRef.current) return;
    renderLeafletMarkers();
  }, [stopsSignature, renderer, renderLeafletMarkers]);

  // Mode change → swap tile style; update marker and cluster CSS. MapLibre only.
  // Skip the very first run (the map was just created with the correct style).
  const modeFirstRun = React.useRef(true);
  React.useEffect(() => {
    if (modeFirstRun.current) { modeFirstRun.current = false; return; }
    if (renderer !== 'maplibre') return;
    const map = mapRef.current;
    if (!map) return;
    const applyStyle = () => {
      map.setStyle(buildMapStyle(mode, providerIdxRef.current));
      // Wait for the new style to settle before touching marker CSS — setStyle can be async.
      map.once('idle', () => {
        map.resize();
        map.triggerRepaint();
      });
    };
    if (map.isStyleLoaded()) applyStyle();
    else map.once('idle', applyStyle);

    markersRef.current.forEach((m) => { m.getElement().dataset.mode = mode; });
    clustersRef.current.forEach((c, i) => {
      const el = document.querySelectorAll('.atlas-cluster')[i];
      if (el) el.dataset.mode = mode;
    });
  }, [mode, renderer]);

  // Badge copy for the active renderer.
  const rendererLabel = renderer === 'maplibre' ? 'MapLibre' : renderer === 'leaflet' ? 'Leaflet' : 'Offline map';
  const badgeStyle = {
    position: 'absolute',
    left: 10,
    bottom: 10,
    zIndex: 5,
    padding: '3px 8px',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: '0.04em',
    borderRadius: 3,
    pointerEvents: 'none',
  };

  return (
    <div className="atlas-map-wrap" data-mode={mode} style={{ position: 'relative' }}>
      {renderer === 'svg' ? (
        <div className="atlas-map">
          <AtlasSvgFallback mode={mode} onStopClick={onStopClick} stopsSignature={stopsSignature} />
        </div>
      ) : renderer === 'leaflet' ? (
        <>
          <div ref={leafletContainerRef} className="atlas-map" style={{ width: '100%', height: '100%' }} />
          {!leafletLoaded && (
            <div className="atlas-map-loading mono-sm">loading map…</div>
          )}
        </>
      ) : (
        <>
          <div ref={containerRef} className="atlas-map" />
          {!libLoaded && (
            <div className="atlas-map-loading mono-sm">loading map…</div>
          )}
        </>
      )}
      {mode === 'cinema' && (
        <>
          <div className="atlas-letterbox atlas-letterbox-top" />
          <div className="atlas-letterbox atlas-letterbox-bottom" />
        </>
      )}
      <div className="atlas-attribution">{renderer === 'svg' ? 'offline atlas · schematic' : renderer === 'leaflet' ? '© OpenStreetMap' : ATTR}</div>
      <div className="atlas-renderer-badge" style={badgeStyle}>{rendererLabel}</div>
    </div>
  );
}

// ---- Page shell (full-page atlas) ------------------------------------------
function Atlas({ mode, onMode, onNav }) {
  const handleStopClick = (_stop) => { onNav('stop'); };
  // Read live project + stops from the store so the atlas page stays in sync
  // with whatever project is loaded (SE1 seed, London Memories, Hackathon,
  // or a user-created one). Falls back to the baked-in demo data only if the
  // store isn't available yet.
  const liveProject = useLCStore(s => s.project) || PROJECT;
  const liveStops   = useLCStore(s => s.stops) || STOPS;

  return (
    <div className="page" data-mode={mode}>
      {/* Top nav — minimal: mode switch + back, since `#public/atlas` has no dedicated shell. */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--mode-bg)',
        borderBottom: '1px solid oklch(from currentColor l c h / 0.15)',
      }}>
        <div className="row items-center between" style={{ padding: '14px 40px', maxWidth: 1680, margin: '0 auto' }}>
          <div className="row items-center gap-16">
            <Roundel />
            <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15 }}>LONDON CUTS · Atlas</div>
            <span className="mono-sm" style={{ opacity: 0.5 }}>{liveProject.title}</span>
          </div>
          <div className="row items-center gap-16">
            <ModePill mode={mode} onMode={onMode} />
            <button className="btn btn-sm" onClick={() => onNav('projects')}>← Back to studio</button>
          </div>
        </div>
      </div>

      <div className="max-wide" style={{ padding: '32px 40px 20px' }}>
        <div className="row between items-end">
          <div>
            <div className="eyebrow">The Atlas — {liveProject.title}</div>
            <h1 style={{ fontFamily: 'var(--mode-display-font)', fontSize: 72, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>
              {liveStops.length} places, placed on London.
            </h1>
          </div>
          <div className="col items-end gap-8">
            <div className="mono-sm">{liveStops.length} stops · drag, zoom, click a marker</div>
            <div className="row gap-8">
              <button className={'chip ' + (mode === 'punk' ? 'chip-solid' : '')} onClick={() => onMode('punk')}>Punk</button>
              <button className={'chip ' + (mode === 'fashion' ? 'chip-solid' : '')} onClick={() => onMode('fashion')}>Fashion</button>
              <button className={'chip ' + (mode === 'cinema' ? 'chip-solid' : '')} onClick={() => onMode('cinema')}>Cinema</button>
            </div>
          </div>
        </div>
      </div>

      {/* Map + sidebar */}
      <div className="max-wide" style={{ padding: '20px 40px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <StopAtlas mode={mode} onStopClick={handleStopClick} />

        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>All stops</div>
          <div className="col">
            {liveStops.map((s) => (
              <div key={s.n} className="row between items-center"
                   style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)', cursor: 'pointer' }}
                   onClick={() => onNav('stop')}>
                <div className="row items-center gap-12">
                  <span className="mono-sm" style={{ width: 24, opacity: 0.5 }}>{s.n}</span>
                  <span style={{ fontFamily: 'var(--mode-display-font)', fontSize: 15, lineHeight: 1.15 }}>{s.title}</span>
                </div>
                <span className="mono-sm" style={{ opacity: 0.6 }}>{s.time}</span>
              </div>
            ))}
          </div>

          <div className="eyebrow" style={{ marginTop: 32, marginBottom: 12 }}>Map mode</div>
          <div className="mono-sm" style={{ opacity: 0.75, lineHeight: 1.55 }}>
            {mode === 'punk' && 'High-contrast B&W tiles — newsprint / xerox energy. Red-orange taped markers, slight tilt. Zine vibe.'}
            {mode === 'fashion' && 'Cream paper base, warm ink at low saturation. Minimal oxblood rings with italic serif numerals, sparse labels.'}
            {mode === 'cinema' && 'Deep blue-black base, hue-shifted roads. Subtitle-yellow markers with glow, letterbox at top and bottom.'}
          </div>
        </div>
      </div>

      {/* Bottom — more projects feed */}
      <div className="max-wide" style={{ padding: '40px' }}>
        <div className="row between items-baseline" style={{ marginBottom: 20 }}>
          <div className="eyebrow">More projects across London</div>
          <div className="row gap-16 mono-sm" style={{ opacity: 0.7 }}>
            <span>Sort: Latest ▾</span>
            <span>Time of day: Any ▾</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {PROJECTS_FEED.concat(PROJECTS_FEED).slice(0, 8).map((p, i) => (
            // keyed by position (i) because we deliberately duplicate the feed
            // to fill 8 tiles from a 6-entry seed — p.id would collide.
            <div key={`feed-${i}`} style={{ cursor: 'pointer' }} onClick={() => onNav('public-project')}>
              <Img label={p.label} tone={p.mode === 'punk' ? 'punk' : p.mode === 'cinema' ? 'dark' : 'warm'} ratio="1/1" />
              <div style={{ fontFamily: 'var(--mode-display-font)', fontSize: 18, marginTop: 8, lineHeight: 1.15 }}>{p.title}</div>
              <div className="mono-sm" style={{ opacity: 0.6, marginTop: 2 }}>{p.author} · {p.mode.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Atlas, StopAtlas });
