// public-atlas.jsx — Real MapLibre GL map with SE1 stops at real coordinates.
// Three mode-specific tile treatments + three mode-specific marker styles.
//
// Library load: maplibre-gl is lazy-loaded from unpkg CDN the first time the
// Atlas screen mounts. Offline users will see the "loading map…" overlay.

// ---- Real SE1 coordinates for the 10 stops in A Year in SE1 ----------------
// These align with STOPS[n].n in data.jsx. They are real SE1 latlngs — you can
// drop them into Google Maps and land on the right block.
const STOP_COORDS = {
  '01': { lng: -0.0910, lat: 51.5055 },  // Borough Market
  '02': { lng: -0.0867, lat: 51.5050 },  // The Shard / Crucifix Lane
  '03': { lng: -0.0991, lat: 51.5076 },  // Tate Modern Turbine Hall
  '04': { lng: -0.1161, lat: 51.5074 },  // Thames foreshore (South Bank)
  '05': { lng: -0.1164, lat: 51.5090 },  // Waterloo Bridge, east side
  '06': { lng: -0.1148, lat: 51.5068 },  // National Theatre façade
  '07': { lng: -0.0974, lat: 51.5037 },  // A pub off Southwark Street
  '08': { lng: -0.0812, lat: 51.4992 },  // Bermondsey Street
  '09': { lng: -0.0754, lat: 51.4964 },  // Grange Road
  '10': { lng: -0.0754, lat: 51.5055 },  // Tower Bridge, north side
};

// ---- Mode-aware style skeletons --------------------------------------------
// We keep to raster OSM tiles (no token) and steer the vibe via raster paint
// props. The V2 brief asks for three distinct map worlds — this is a first
// pass we can hand to Claude Design as the starting point.
const TILES = {
  voyager: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  dark:    'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
};
const ATTR = '© OpenStreetMap © CARTO';

function buildMapStyle(mode) {
  if (mode === 'cinema') {
    return {
      version: 8,
      sources: { t: { type: 'raster', tiles: [TILES.dark], tileSize: 256, attribution: ATTR } },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#050a18' } },
        { id: 't', type: 'raster', source: 't', paint: {
          'raster-saturation': -0.4,
          'raster-hue-rotate': 210,
          'raster-brightness-min': 0.0,
          'raster-brightness-max': 0.6,
          'raster-contrast': 0.15,
          'raster-opacity': 0.95,
        } },
      ],
    };
  }
  if (mode === 'punk') {
    return {
      version: 8,
      sources: { t: { type: 'raster', tiles: [TILES.voyager], tileSize: 256, attribution: ATTR } },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#f4f1e8' } },
        { id: 't', type: 'raster', source: 't', paint: {
          'raster-saturation': -1,
          'raster-contrast': 0.5,
          'raster-brightness-min': 0.08,
          'raster-brightness-max': 0.92,
        } },
      ],
    };
  }
  // fashion — cream paper, low-sat warm ink
  return {
    version: 8,
    sources: { t: { type: 'raster', tiles: [TILES.voyager], tileSize: 256, attribution: ATTR } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#f7f1e6' } },
      { id: 't', type: 'raster', source: 't', paint: {
        'raster-saturation': -0.55,
        'raster-hue-rotate': 10,
        'raster-brightness-min': 0.8,
        'raster-brightness-max': 1.0,
        'raster-opacity': 0.8,
        'raster-contrast': -0.05,
      } },
    ],
  };
}

// ---- Lazy loader for maplibre-gl -------------------------------------------
function useMapLibre() {
  const [loaded, setLoaded] = React.useState(() => \!\!window.maplibregl);
  React.useEffect(() => {
    if (loaded) return;

    if (\!document.querySelector('link[data-maplibre]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      l.setAttribute('data-maplibre', '1');
      document.head.appendChild(l);
    }

    let s = document.querySelector('script[data-maplibre]');
    if (\!s) {
      s = document.createElement('script');
      s.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
      s.async = true;
      s.setAttribute('data-maplibre', '1');
      document.head.appendChild(s);
    }
    const poll = setInterval(() => {
      if (window.maplibregl) { setLoaded(true); clearInterval(poll); }
    }, 80);
    return () => clearInterval(poll);
  }, [loaded]);
  return loaded;
}

// ---- The map component -----------------------------------------------------
function StopAtlas({ mode, onStopClick }) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const clustersRef = React.useRef([]);
  const [hover, setHover] = React.useState(null);
  const [clusters, setClusters] = React.useState([]);
  const libLoaded = useMapLibre();

  // Helper: build hover card content with hero image or tone swatch
  const buildHoverCard = (stop) => {
    let heroImg = null;
    try {
      // Try Agent E's helper first
      if (window.storeActions?.getStopImageUrl) {
        heroImg = window.storeActions.getStopImageUrl(stop.n);
      }
      // Fallback to direct store access
      if (\!heroImg) {
        const state = window.LCStore?.getState?.();
        if (state && state.stops) {
          const stopData = state.stops.find(s => s.id === stop.n);
          if (stopData && stopData.heroAssetId && state.assets) {
            const asset = state.assets.find(a => a.id === stopData.heroAssetId);
            if (asset && asset.blobUrl) {
              heroImg = asset.blobUrl;
            }
          }
        }
      }
    } catch (e) {
      // Silently fail if store unavailable
    }

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
    const coords = cluster.stops.map(s => STOP_COORDS[s.n]).filter(Boolean);
    if (\!coords.length) return null;
    const bounds = new window.maplibregl.LngLatBounds();
    coords.forEach(c => bounds.extend([c.lng, c.lat]));
    return bounds;
  };

  // Helper: update clusters on zoom/pan
  const updateClusters = () => {
    if (\!mapRef.current || \!mapRef.current.loaded()) return;

    clustersRef.current.forEach(m => m.remove());
    clustersRef.current = [];
    setClusters([]);

    const stops = window.STOPS || [];
    const projections = stops.map(s => ({
      stop: s,
      screen: mapRef.current.project([STOP_COORDS[s.n].lng, STOP_COORDS[s.n].lat]),
    }));

    const placed = new Set();
    const newClusters = [];

    for (const { stop, screen } of projections) {
      if (placed.has(stop.n)) continue;

      let foundCluster = false;
      for (const cluster of newClusters) {
        const clusterScreens = cluster.stops.map(s => {
          const c = STOP_COORDS[s.n];
          return mapRef.current.project([c.lng, c.lat]);
        });
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

      if (\!foundCluster) {
        newClusters.push({ stops: [stop], screen });
        placed.add(stop.n);
      }
    }

    newClusters.forEach(cluster => {
      if (cluster.stops.length < 2) return;

      const clusterScreen = cluster.stops.reduce(
        (acc, s) => {
          const proj = mapRef.current.project([STOP_COORDS[s.n].lng, STOP_COORDS[s.n].lat]);
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

  // Initialize once library is ready
  React.useEffect(() => {
    if (\!libLoaded || \!containerRef.current || mapRef.current) return;

    const map = new window.maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle(mode),
      center: [-0.0980, 51.5035],
      zoom: 14.2,
      minZoom: 12,
      maxZoom: 18,
      attributionControl: false,
    });
    map.addControl(new window.maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'bottom-right');
    mapRef.current = map;

    const addMarkers = () => {
      if (markersRef.current.length) return;
      (window.STOPS || []).forEach((stop) => {
        const coords = STOP_COORDS[stop.n];
        if (\!coords) return;
        const el = document.createElement('div');
        el.className = 'atlas-marker';
        el.dataset.mode = mode;
        el.innerHTML = '<span class="atlas-marker-n">' + stop.n + '</span>';
        
        const hoverCard = buildHoverCard(stop);
        let popupShown = false;
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          map.flyTo({ center: [coords.lng, coords.lat], zoom: 15.5, duration: 600, essential: true });
          map.once('moveend', () => {
            if (onStopClick) onStopClick(stop);
          });
        });
        
        el.addEventListener('mouseenter', () => {
          if (\!popupShown) {
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
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });

      const bounds = new window.maplibregl.LngLatBounds();
      (window.STOPS || []).forEach((s) => {
        const c = STOP_COORDS[s.n];
        if (c) bounds.extend([c.lng, c.lat]);
      });
      if (\!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: { top: 60, right: 40, bottom: 100, left: 40 }, maxZoom: 15, duration: 0 });
      }
    };

    if (map.isStyleLoaded()) addMarkers();
    else map.once('load', addMarkers);

    const handleMapChange = () => {
      setTimeout(updateClusters, 50);
    };
    map.on('zoom', handleMapChange);
    map.on('zoomend', handleMapChange);
    map.on('move', handleMapChange);

    return () => {
      map.off('zoom', handleMapChange);
      map.off('zoomend', handleMapChange);
      map.off('move', handleMapChange);
      clustersRef.current.forEach(c => c.remove?.());
      clustersRef.current = [];
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [libLoaded]);

  // Mode change → swap tile style; update marker and cluster CSS
  React.useEffect(() => {
    if (\!mapRef.current) return;
    mapRef.current.setStyle(buildMapStyle(mode));
    markersRef.current.forEach((m) => {
      const el = m.getElement();
      el.dataset.mode = mode;
    });
    clustersRef.current.forEach((c, i) => {
      const el = document.querySelectorAll('.atlas-cluster')[i];
      if (el) el.dataset.mode = mode;
    });
  }, [mode]);

  return (
    <div className="atlas-map-wrap" data-mode={mode}>
      <div ref={containerRef} className="atlas-map" />
      {\!libLoaded && (
        <div className="atlas-map-loading mono-sm">loading map…</div>
      )}
      {mode === 'cinema' && (
        <>
          <div className="atlas-letterbox atlas-letterbox-top" />
          <div className="atlas-letterbox atlas-letterbox-bottom" />
        </>
      )}
      <div className="atlas-attribution">{ATTR}</div>
    </div>
  );
}

// ---- Page shell (full-page atlas) ------------------------------------------
function Atlas({ mode, onMode, onNav }) {
  const handleStopClick = (_stop) => { onNav('stop'); };

  return (
    <div className="page" data-mode={mode}>
      <PublicNav mode={mode} onMode={onMode} screen="atlas" onNav={onNav} />

      <div className="max-wide" style={{ padding: '32px 40px 20px' }}>
        <div className="row between items-end">
          <div>
            <div className="eyebrow">The Atlas — {PROJECT.title}</div>
            <h1 style={{ fontFamily: 'var(--mode-display-font)', fontSize: 72, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>
              Ten cuts, placed on SE1.
            </h1>
          </div>
          <div className="col items-end gap-8">
            <div className="mono-sm">{STOPS.length} stops · drag, zoom, click a marker</div>
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
            {STOPS.map((s) => (
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
            <div key={i} style={{ cursor: 'pointer' }} onClick={() => onNav('public-project')}>
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

Object.assign(window, { Atlas, StopAtlas, STOP_COORDS });
