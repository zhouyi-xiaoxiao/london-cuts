// seed-demo.jsx — Loads 13 real photos from 伦敦记忆 (London memories) with
// actual GPS coordinates (EXIF) + content describing what's really in each photo.
// Chronological-ish. Photos span from Heathrow arrival to New Year's angels.

const SEED_LONDON_MEMORY = [
  {
    n: '01', code: 'TW6', title: 'UK Border, arriving', time: '20:03',
    mood: 'Fluorescent', tone: 'cool',
    lat: 51.469955, lng: -0.4474217,
    label: 'HEATHROW · T5',
    date: '20 Nov 2025',
    asset: 'IMG_7711',
    status: { upload: true, hero: true, body: true, media: 'done' },
    body: [
      { type: 'metaRow', content: ['20:03', '20 NOV 2025', 'Fluorescent', 'HEATHROW · UK BORDER'] },
      { type: 'heroImage', assetId: 'seed-01', caption: 'The queue bends under the blue signs.' },
      { type: 'paragraph', content: 'Every London memory begins here. The blue signs, the queue, the officer who never smiles. Fluorescent light flattens everyone to the same pale shape.' },
      { type: 'pullQuote', content: 'You are not here yet, but you are not where you came from either.' },
      { type: 'paragraph', content: 'I always take a photo at this bit. It looks identical to the last one, and the one before. The only thing that changes is who I am when I walk up to the booth.' },
    ],
    postcard: {
      message: 'Landed. Still standing in line but technically home now.\n— A.',
      recipient: { name: 'Mama', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '02', code: 'SL4', title: "Windsor guards, midday", time: '10:39',
    mood: 'Scarlet', tone: 'warm',
    lat: 51.484262, lng: -0.603797,
    label: 'WINDSOR · CASTLE',
    date: '09 Sep 2025',
    asset: 'IMG_3837',
    status: { upload: true, hero: true, body: true, media: null },
    body: [
      { type: 'metaRow', content: ['10:39', '09 SEP 2025', 'Scarlet', 'WINDSOR · CASTLE'] },
      { type: 'heroImage', assetId: 'seed-02', caption: 'Two guards, mid-step, the bearskins almost black in the sun.' },
      { type: 'paragraph', content: 'Took the train out to Windsor on a Tuesday. They change guard every hour. The tourists raise their phones in a synchronised arc — I was one of them.' },
      { type: 'paragraph', content: 'The red is louder than you think it is. It cuts right across the stone.' },
    ],
    postcard: {
      message: 'Day-tripped out to Windsor. They still wear the hats.\n— A.',
      recipient: { name: 'Dad', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '03', code: 'SL4', title: "Inside St George's", time: '12:23',
    mood: 'Vaulted', tone: 'cool',
    lat: 51.484163, lng: -0.602595,
    label: 'WINDSOR · CHAPEL',
    date: '09 Sep 2025',
    asset: 'IMG_3884',
    status: { upload: true, hero: true, body: true, media: null },
    body: [
      { type: 'metaRow', content: ['12:23', '09 SEP 2025', 'Vaulted', "ST GEORGE'S · GOTHIC"] },
      { type: 'heroImage', assetId: 'seed-03', caption: 'The ribs in the ceiling throw their own shadows.' },
      { type: 'paragraph', content: "Inside, everything went quiet. Fan vaulting overhead — I can never remember the term until I'm looking straight up at it." },
      { type: 'pullQuote', content: 'Gothic is just maths with shadows.' },
    ],
    postcard: {
      message: 'Kept going up to Windsor after the guards. The chapel is mostly ceiling.\n— A.',
      recipient: { name: 'M.', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '04', code: 'NW3', title: 'The stained glass, Hampstead', time: '15:51',
    mood: 'Amber', tone: 'warm',
    lat: 51.581453, lng: -0.146456,
    label: 'HAMPSTEAD · WINDOW',
    date: '21 Aug 2025',
    asset: 'IMG_3083',
    status: { upload: true, hero: true, body: true, media: null },
    body: [
      { type: 'metaRow', content: ['15:51', '21 AUG 2025', 'Amber', 'HAMPSTEAD · WINDOW'] },
      { type: 'heroImage', assetId: 'seed-04', caption: 'Fifteen little squares, each a different afternoon.' },
      { type: 'paragraph', content: 'A friend has this window in the bathroom of her place in Hampstead. The glass is old enough to warp the garden behind it into something dreamlike.' },
      { type: 'paragraph', content: 'Green, pink, lilac, a sliver of amber. I stood on the bath just to take the photo.' },
    ],
    postcard: {
      message: "The light in J.'s flat does this thing when the sun is low.\n— A.",
      recipient: { name: 'J.', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '05', code: 'N19', title: 'Mind the gap, Northern line', time: '15:35',
    mood: 'Underground', tone: 'cool',
    lat: 51.556705, lng: -0.138061,
    label: 'KENTISH TOWN · TUBE',
    date: '23 Aug 2025',
    asset: 'IMG_3162',
    status: { upload: true, hero: true, body: true, media: 'done' },
    body: [
      { type: 'metaRow', content: ['15:35', '23 AUG 2025', 'Underground', 'NORTHERN LINE · 51558'] },
      { type: 'heroImage', assetId: 'seed-05', caption: 'The train pulls in; the woman in yellow does not move.' },
      { type: 'paragraph', content: 'Train 51558, via Charing Cross. Woman in a mustard blazer stood absolutely still while the carriage blasted past. Three other people drifted, one with headphones, not looking up.' },
      { type: 'pullQuote', content: 'Mind the gap.' },
    ],
    postcard: {
      message: 'The yellow line still says it. Every time.\n— A.',
      recipient: { name: 'S.', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '06', code: 'SE1', title: 'Royal Festival Hall, graduation', time: '17:05',
    mood: 'Ceremonial', tone: 'warm',
    lat: 51.5070, lng: -0.1207,
    label: 'SOUTH BANK · UCL',
    date: '11 Sep 2025',
    asset: 'IMG_4151',
    status: { upload: true, hero: true, body: true, media: null },
    body: [
      { type: 'metaRow', content: ['17:05', '11 SEP 2025', 'Ceremonial', 'RFH · UCL GRADUATION'] },
      { type: 'heroImage', assetId: 'seed-06', caption: 'From the circle, purple and red and blue from the flowers up the aisle.' },
      { type: 'paragraph', content: 'The Royal Festival Hall for graduation. Gowns in rows like a patient army, the chancellor at the UCL podium quoting something about "the opportunity to celebrate your academic achievements".' },
      { type: 'paragraph', content: 'Somebody was crying three seats down. I think it was the hats.' },
    ],
    postcard: {
      message: "Got through it. I'm officially something now.\n— A.",
      recipient: { name: 'Mama & Dad', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '07', code: 'TW3', title: 'An underpass in Hounslow', time: '19:08',
    mood: 'Neon', tone: 'punk',
    lat: 51.491403, lng: -0.411013,
    label: 'HOUNSLOW · GRAFFITI',
    date: '13 Sep 2025',
    asset: 'IMG_4566',
    status: { upload: true, hero: true, body: true, media: 'running' },
    body: [
      { type: 'metaRow', content: ['19:08', '13 SEP 2025', 'Neon', 'HOUNSLOW · UNDERPASS'] },
      { type: 'heroImage', assetId: 'seed-07', caption: 'Flames and flat geometry, repeated down the tunnel until they are just light.' },
      { type: 'paragraph', content: "Walking home the long way and found this. Someone sprayed the whole wall — flames out of orange, blue shapes under them. I don't know who it was. It looked better than half the art in the Tate." },
      { type: 'pullQuote', content: 'If you can smell the paint it is still alive.' },
    ],
    postcard: {
      message: "The graffiti under the A4 is the loudest thing for miles.\n— A.",
      recipient: { name: 'R.', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '08', code: 'E14', title: 'Canary Wharf at night', time: '20:31',
    mood: 'Red beacons', tone: 'cool',
    lat: 51.501992, lng: -0.001153,
    label: 'ISLE OF DOGS · WHARF',
    date: '27 Sep 2025',
    asset: 'IMG_5577',
    status: { upload: true, hero: true, body: true, media: null },
    body: [
      { type: 'metaRow', content: ['20:31', '27 SEP 2025', 'Red beacons', 'CANARY WHARF'] },
      { type: 'heroImage', assetId: 'seed-08', caption: 'Every tall thing in the city has a red light on top.' },
      { type: 'paragraph', content: 'Walked round Isle of Dogs with a friend. All the towers on the other side of the river had the aviation lights on — little red dots at the top of every crane and every office.' },
      { type: 'paragraph', content: 'HSBC. Barclays. A building we could not name.' },
    ],
    postcard: {
      message: 'The tall buildings all have red hats at night.\n— A.',
      recipient: { name: 'D.', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '09', code: 'N1', title: 'Tapas, chalkboard specials', time: '19:14',
    mood: 'Padron', tone: 'warm',
    lat: 51.535888, lng: -0.126808,
    label: 'ISLINGTON · TAPAS',
    date: '30 May 2025',
    asset: 'IMG_8469',
    status: { upload: true, hero: true, body: true, media: null },
    body: [
      { type: 'metaRow', content: ['19:14', '30 MAY 2025', 'Padron', 'SPANISH · SPECIALS BOARD'] },
      { type: 'heroImage', assetId: 'seed-09', caption: 'The specials: Cauliflower Croquetas £8.50, Pintxo de Atún £19, Langoustines £24, John Dory / Ajoblanco £25, Monkfish Bilboína £20.' },
      { type: 'paragraph', content: 'Dinner with C. The waitress held the specials board at our table, bottle of still water crossing the frame.' },
      { type: 'paragraph', content: 'We had the Langoustines and the Monkfish. The John Dory was sold out.' },
    ],
    postcard: {
      message: 'Dinner with C at the place round the corner. Three spicy padron out of eighteen.\n— A.',
      recipient: { name: 'C.', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '10', code: 'N4', title: 'Pink sky, Finsbury Park', time: '04:05',
    mood: 'Sunrise', tone: 'warm',
    lat: 51.562563, lng: -0.109153,
    label: 'FINSBURY PARK · DAWN',
    date: '06 Jul 2025',
    asset: 'IMG_9931',
    status: { upload: true, hero: true, body: true, media: null },
    body: [
      { type: 'metaRow', content: ['04:05', '06 JUL 2025', 'Sunrise', 'N4 · BRICK ROOFS'] },
      { type: 'heroImage', assetId: 'seed-10', caption: 'One single cloud, burning.' },
      { type: 'paragraph', content: "Woke up at four because I couldn't sleep, walked to the corner shop, and the sky was doing this. One cloud, lit from below, pink like a bruise that could not decide what it was." },
      { type: 'pullQuote', content: 'The brick was the last thing to catch.' },
    ],
    postcard: {
      message: "Couldn't sleep. The sky looked like this. Sending love.\n— A.",
      recipient: { name: 'N.', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '11', code: 'NW1', title: 'Pulse Fitness, Camden', time: '19:23',
    mood: 'Green plates', tone: 'cool',
    lat: 51.525013, lng: -0.132781,
    label: 'CAMDEN · PULSE',
    date: '18 Apr 2026',
    asset: 'IMG_8774',
    status: { upload: true, hero: true, body: true, media: null },
    body: [
      { type: 'metaRow', content: ['19:23', '18 APR 2026', 'Green plates', 'PULSE · SQUAT RACK'] },
      { type: 'heroImage', assetId: 'seed-11', caption: 'Ten-kilogram plates, green, pulsefitness.' },
      { type: 'paragraph', content: 'The gym at the top of Camden High Street. I came here for the first time in a week, and everything felt twice as heavy.' },
      { type: 'paragraph', content: "Somebody else's chalk was already on the bar." },
    ],
    postcard: {
      message: 'Back to the gym. The bars do not forgive a week off.\n— A.',
      recipient: { name: 'Myself', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '12', code: 'W1', title: 'Piccadilly at night', time: '23:05',
    mood: 'Amber', tone: 'warm',
    lat: 51.508755, lng: -0.137414,
    label: 'PICCADILLY · BUSES',
    date: '17 Apr 2026',
    asset: 'IMG_8745',
    status: { upload: true, hero: true, body: true, media: 'done' },
    body: [
      { type: 'metaRow', content: ['23:05', '17 APR 2026', 'Amber', 'PICCADILLY · W1'] },
      { type: 'heroImage', assetId: 'seed-12', caption: 'Six red buses in a row. A cyclist lit from below.' },
      { type: 'paragraph', content: 'Walking home past the Criterion. The buses were lined up like they were in a film — six of them, tail-lights all red, one cyclist cutting between them.' },
      { type: 'pullQuote', content: 'London after eleven is mostly red.' },
    ],
    postcard: {
      message: 'Six buses in a row. A cyclist threading through them.\n— A.',
      recipient: { name: 'M.', line1: '', line2: '', country: '' },
    },
  },
  {
    n: '13', code: 'W1B', title: "Angels on Regent Street, New Year's Eve", time: '23:57',
    mood: 'Festive', tone: 'punk',
    lat: 51.5133, lng: -0.1408,
    label: 'REGENT ST · NEW YEAR',
    date: '31 Dec 2025',
    asset: 'IMG_0294',
    status: { upload: true, hero: true, body: true, media: null },
    body: [
      { type: 'metaRow', content: ['23:57', '31 DEC 2025', 'Festive', 'REGENT ST · NEW YEAR'] },
      { type: 'heroImage', assetId: 'seed-13', caption: 'White angels strung above the street, three minutes before midnight.' },
      { type: 'paragraph', content: "Walked down Regent Street with the last of the year. The angels have been up since November but only now, this close to midnight, does everyone slow down to look at them." },
      { type: 'pullQuote', content: 'The last light of the old year is held up by wires.' },
      { type: 'paragraph', content: "Someone next to me was holding a bottle wrapped in paper. Someone else was on the phone with a voice tinned-out on the other end. I took the photo and kept walking." },
    ],
    postcard: {
      message: "Regent St before midnight. The angels look like they always have.\n— A.",
      recipient: { name: 'J.', line1: '', line2: '', country: '' },
    },
  },
];

const SEED_ASSETS = SEED_LONDON_MEMORY.map(s => ({
  id: `seed-${s.n}`,
  stop: s.n,
  tone: s.tone,
  imageUrl: `seed-images/${s.asset}.jpg`,
  // Stable identity for the variant cache so reloading the demo doesn't
  // regenerate images already in IDB. Keyed by EXIF filename, not by the
  // URL (which would include the path prefix).
  sourceName: `${s.asset}.jpg`,
}));

// Attach heroAssetId + assetIds to each stop
SEED_LONDON_MEMORY.forEach(s => {
  s.heroAssetId = `seed-${s.n}`;
  s.assetIds = [`seed-${s.n}`];
});

// Strip the asset key that we only used for wiring
const SEED_STOPS_CLEAN = SEED_LONDON_MEMORY.map(({ asset, date, ...rest }) => rest);

const SEED_MEDIA_TASKS = [
  { id: 'tk_seed_01', kind: 'img2vid', stopId: '01', mode: 'cinema', state: 'done',    progress: 1.0,  prompt: 'fluorescent border queue, 3s pan, documentary' },
  { id: 'tk_seed_05', kind: 'img2img', stopId: '05', mode: 'fashion', state: 'done',   progress: 1.0,  prompt: 'Northern line train arrival, editorial crop' },
  { id: 'tk_seed_07', kind: 'img2img', stopId: '07', mode: 'punk',    state: 'running', progress: 0.48, prompt: 'graffiti flames, higher contrast, grainier' },
  { id: 'tk_seed_12', kind: 'img2img', stopId: '12', mode: 'cinema',  state: 'done',   progress: 1.0,  prompt: 'amber buses, letterbox subtitle composition' },
];

function loadLondonMemoryDemo() {
  if (!window.LCStore || !window.LCStore.setState) {
    console.warn('[seed-demo] LCStore not ready');
    return;
  }

  // Multi-project: save whatever's currently loaded before replacing it, so
  // the user can switch back to it later from the Projects list.
  try { window.storeActions?.archiveCurrentProject?.(); } catch (e) { console.warn('[seed-demo] archive failed', e); }

  window.LCStore.setState(s => ({
    ...s,
    project: {
      ...s.project,
      title: 'London, Remembered',
      author: 'You',
      subtitle: 'Thirteen photos, thirteen places. From Heathrow arrival to the New Year angels on Regent Street.',
      slug: 'london-remembered',
      defaultMode: 'fashion',
      visibility: 'draft',
      coverLabel: 'LONDON · MEMORIES',
      tags: ['London', 'Memories', 'Walking'],
      published: null,
      reads: 0,
      saves: 0,
      duration: '13 min read',
    },
    stops: SEED_STOPS_CLEAN.map(st => ({ ...st })),
    assetsPool: SEED_ASSETS.map(a => ({ ...a })),
    mediaTasks: SEED_MEDIA_TASKS.map(t => ({ ...t })),
    ui: {
      ...s.ui,
      mode: 'fashion',
      activeStopId: '01',
      drawerOpen: true,
      drawerTab: 'assets',
      publishOpen: false,
    },
  }));

  console.log('[seed-demo] London, Remembered loaded · 13 stops · 13 assets · real GPS from EXIF');

  // Restore any previously-cached variants immediately (cache hits are free).
  // Then auto-kick pre-generation to fill in the missing styles.
  if (typeof window !== 'undefined') {
    // 1. Cache restore first — fast, no network, populates VariantsRow on
    //    every stop the user has already generated styles for.
    setTimeout(async () => {
      try {
        if (window.storeActions?.restoreCachedVariantsForCurrent) {
          const n = await window.storeActions.restoreCachedVariantsForCurrent();
          if (n > 0) console.log('[seed-demo] restored', n, 'cached variants from IDB');
        }
      } catch (e) { console.warn('[seed-demo] restore cache failed', e); }
    }, 800);
    // 2. Fill gaps with pre-gen. Prestyle's `hasVariantForStyle` dedup plus
    //    the fresh cache-restore above means we only pay for truly new ones.
    //    Skip entirely in demo mode (no key available) — the snapshot in
    //    app/generated-images/ already populated every variant we need for
    //    the public showcase, so there's nothing to generate.
    setTimeout(() => {
      const hasKey = !!(sessionStorage.getItem('lc_openai_key') || window.__LC_OPENAI_KEY_DEFAULT);
      if (!hasKey) {
        console.log('[seed-demo] demo mode (no key) — skipping auto pre-gen; variants come from app/generated-images/');
        return;
      }
      if (typeof window.pregenerateAllStyles === 'function' && !window.__lcPrestyleRunning) {
        try { window.pregenerateAllStyles({ auto: true }); }
        catch (e) { console.warn('[seed-demo] auto pre-gen failed', e); }
      }
    }, 2500);
  }
}

window.SEED_LONDON_MEMORY = SEED_STOPS_CLEAN;
window.SEED_ASSETS = SEED_ASSETS;
window.SEED_MEDIA_TASKS = SEED_MEDIA_TASKS;
window.loadLondonMemoryDemo = loadLondonMemoryDemo;
window.SEED_LONDON_MEMORY_AVAILABLE = true;
