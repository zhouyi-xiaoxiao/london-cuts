// data.jsx — mock content for all screens

const PROJECT = {
  title: 'A Year in SE1',
  author: 'Ana Ishii',
  subtitle: 'Ten walks between Bermondsey and Waterloo, 2025–2026',
  coverLabel: 'SOUTHWARK · GOLDEN HOUR',
  tags: ['SE1', 'Walking', 'Thames'],
  published: '14 APR 2026',
  reads: 2487,
  saves: 214,
  stops: 10,
  duration: '42 min read',
};

const STOPS = [
  { n: '01', code: 'SE1 9DT', title: 'Borough Market at Opening', time: '07:12', mood: 'Amber', tone: 'warm', label: 'BOROUGH MKT · MORNING' },
  { n: '02', code: 'SE1 2AA', title: 'The Shard from Crucifix Lane', time: '08:04', mood: 'Steel', tone: 'cool', label: 'CRUCIFIX LN · GLASS' },
  { n: '03', code: 'SE1 9DA', title: 'Tate Modern Turbine Hall', time: '10:27', mood: 'Rust', tone: 'punk', label: 'TATE · TURBINE HALL' },
  { n: '04', code: 'SE1 8XX', title: 'Thames at low tide', time: '11:48', mood: 'Mud', tone: 'warm', label: 'SOUTH BANK · MUDLARK' },
  { n: '05', code: 'SE1 7PB', title: 'Waterloo bridge, facing east', time: '17:19', mood: 'Gold', tone: 'warm', label: 'WATERLOO BR · DUSK' },
  { n: '06', code: 'SE1 8UP', title: 'The National Theatre façade', time: '19:02', mood: 'Concrete', tone: 'cool', label: 'NATIONAL · BRUTALIST' },
  { n: '07', code: 'SE1 9PX', title: 'A pub off Southwark Street', time: '20:15', mood: 'Ember', tone: 'warm', label: 'SOUTHWARK · PINT' },
  { n: '08', code: 'SE1 2SD', title: 'Bermondsey Street by night', time: '22:40', mood: 'Neon', tone: 'punk', label: 'BERMONDSEY ST · NEON' },
  { n: '09', code: 'SE1 3UN', title: 'The walk home', time: '23:51', mood: 'Blue', tone: 'cool', label: 'GRANGE RD · STREETLIGHT' },
  { n: '10', code: 'SE1 5EN', title: 'Morning after, Tower Bridge', time: '06:34', mood: 'Silver', tone: 'cool', label: 'TOWER BR · FIRST LIGHT' },
];

const PROJECTS_FEED = [
  { id: 1, title: 'A Year in SE1', author: 'Ana Ishii', stops: 10, mode: 'fashion', label: 'SOUTHWARK · COVER', reads: '2.4k' },
  { id: 2, title: 'Mudlark Diaries', author: 'Ty Okafor', stops: 14, mode: 'punk', label: 'THAMES · FORESHORE', reads: '891' },
  { id: 3, title: '48 Hours in E8', author: 'Priya Shah', stops: 8, mode: 'cinema', label: 'HACKNEY · NIGHT', reads: '4.1k' },
  { id: 4, title: 'The Jubilee Walk', author: 'Lena Park', stops: 12, mode: 'fashion', label: 'WESTMINSTER · DAY', reads: '1.2k' },
  { id: 5, title: 'Last Trains', author: 'Marco Reed', stops: 7, mode: 'cinema', label: 'UNDERGROUND · 00:47', reads: '3.6k' },
  { id: 6, title: 'Brick Lane after rain', author: 'Yui Tanaka', stops: 9, mode: 'punk', label: 'E1 · WET ASPHALT', reads: '624' },
];

Object.assign(window, { PROJECT, STOPS, PROJECTS_FEED });
