import type { BodyBlock, PostcardRecipient } from "@/lib/seed";

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lc_locale";

export interface Localized<T> {
  en?: Partial<T>;
  zh?: Partial<T>;
}

export interface ProjectTranslation {
  title: string;
  subtitle: string | null;
  description: string;
  locationName: string | null;
  coverLabel: string;
  tags: readonly string[];
  duration: string;
  author: string;
}

export interface StopTranslation {
  title: string;
  time: string;
  mood: string;
  label: string;
  code: string;
  body: readonly BodyBlock[];
}

export interface PostcardTranslation {
  message: string;
  recipient: PostcardRecipient;
}

export interface AssetTranslation {
  alt: string;
  caption: string | null;
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  if (normalized === "zh" || normalized === "zh-cn" || normalized.startsWith("zh-")) {
    return "zh";
  }
  if (normalized === "en" || normalized === "en-us" || normalized === "en-gb" || normalized.startsWith("en-")) {
    return "en";
  }
  return null;
}

export function localeFromAcceptLanguage(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const candidates = value
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .filter(Boolean);
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return null;
}

export function cookieLocale(cookieHeader: string | null | undefined): Locale | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`));
  if (!match) return null;
  return normalizeLocale(decodeURIComponent(match.slice(LOCALE_COOKIE.length + 1)));
}

export function resolveLocaleFromRequest(req: Request): Locale {
  const url = new URL(req.url);
  return (
    normalizeLocale(url.searchParams.get("lang")) ??
    normalizeLocale(req.headers.get("x-lc-locale")) ??
    cookieLocale(req.headers.get("cookie")) ??
    localeFromAcceptLanguage(req.headers.get("accept-language")) ??
    DEFAULT_LOCALE
  );
}

export function resolveLocaleFromHeaders(headers: Headers): Locale {
  return (
    normalizeLocale(headers.get("x-lc-locale")) ??
    cookieLocale(headers.get("cookie")) ??
    localeFromAcceptLanguage(headers.get("accept-language")) ??
    DEFAULT_LOCALE
  );
}

export function stripLocalePrefix(pathname: string): { locale: Locale | null; pathname: string } {
  const parts = pathname.split("/");
  const locale = normalizeLocale(parts[1]);
  if (!locale) return { locale: null, pathname };
  const stripped = `/${parts.slice(2).join("/")}`.replace(/\/+$/, "") || "/";
  return { locale, pathname: stripped };
}

export function localizePath(pathname: string, locale: Locale): string {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  const { pathname: stripped } = stripLocalePrefix(pathname || "/");
  return `/${locale}${stripped === "/" ? "" : stripped}`;
}

export function addLangParam(url: string, locale: Locale): string {
  const [base, hash = ""] = url.split("#");
  const [path, query = ""] = base.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", locale);
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`;
}

const UI_EN = {
  "language.label": "Language",
  "language.en": "English",
  "language.zh": "中文",
  "common.loading": "Loading...",
  "common.error": "Something went wrong.",
  "common.back": "Back",
  "common.close": "Close",
  "common.copyLink": "Copy link",
  "common.open": "Open",
  "common.unknown": "unknown",
  "mode.label": "Narrative mode",
  "mode.punk": "Punk",
  "mode.fashion": "Fashion",
  "mode.cinema": "Cinema",
  "public.publishedVia": "Published via London Cuts",
  "public.atlasAria": "Atlas for this project",
  "public.atlasLink": "Atlas",
  "public.atlasLinkAria": "Browse the atlas of all projects",
  "public.stopsAria": "Stops in this project",
  "public.stops": "stops",
  "public.noHero": "No hero yet",
  "public.reads": "reads",
  "public.stop": "Stop",
  "public.openPostcard": "Open postcard",
  "public.backToProject": "Back to project",
  "public.lastStop": "Last stop",
  "public.draftChapter": "This chapter is still in draft.",
  "public.backToChapter": "Back to chapter",
  "public.postcard": "Postcard",
  "public.pngFront": "PNG front",
  "public.pngBack": "PNG back",
  "public.pdf": "PDF",
  "public.exporting": "Exporting...",
  "public.noPostcardFront": "Postcard has no front image yet.",
  "notFound.eyebrow": "Nothing here - yet",
  "notFound.suffix": "isn't in this browser.",
  "notFound.body": "London Cuts is in public beta. Public projects load from the cloud when available, otherwise this browser may not have the local draft data behind the link.",
  "notFound.openAtlas": "Open the atlas",
  "notFound.enterStudio": "Enter your studio",
  "auth.signInEyebrow": "London Cuts - Sign in",
  "auth.signInTitle": "Sign in with email.",
  "auth.sentTitle": "Check your email.",
  "auth.email": "Email",
  "auth.sendMagic": "Send magic link",
  "auth.sending": "Sending...",
  "auth.rateLimited": "Email sending is temporarily limited. Wait a little, then request a new magic link.",
  "auth.sendFailed": "could not send magic link",
  "auth.requestFailed": "request failed",
  "auth.sentBody": "We sent a one-time link to {email}. Click the link in your inbox to finish signing in.",
  "auth.sentHelp": "Nothing in your inbox after a minute? Check spam, or try a different address below.",
  "auth.useDifferent": "Use a different email",
  "auth.passwordless": "No password to remember. We'll email you a link to sign in. First-time sign-ins need an invite code from the project owner.",
  "onboarding.eyebrow": "London Cuts - Welcome",
  "onboarding.title": "Set up your travel journal.",
  "onboarding.checking": "Checking your session...",
  "onboarding.signInFirst": "Sign in first. We'll bounce you back here after.",
  "onboarding.goSignIn": "Go to sign-in",
  "onboarding.already": "You're already set up as @{handle}.",
  "onboarding.openStudio": "Open your studio",
  "onboarding.signedIn": "Signed in as {email}. Just three quick things before you start writing.",
  "onboarding.name": "Your name",
  "onboarding.nameHelp": "Shown on your published pages, like a byline. Can be changed later.",
  "onboarding.pageAddress": "Your page address",
  "onboarding.pageHelp": "The short name that goes in the link when you share a trip. Lowercase letters, digits, or hyphens.",
  "onboarding.invite": "Invite code",
  "onboarding.inviteHelp": "The code from whoever invited you. Each code is for one person - enter it here to activate your account.",
  "onboarding.start": "Start writing",
  "onboarding.settingUp": "Setting up...",
  "onboarding.privateNote": "None of this is public yet. You control what gets shared when you publish a trip.",
  "studio.title": "London Cuts Studio",
  "studio.projects": "Projects",
  "studio.newProject": "New project",
  "studio.yourWork": "Your work.",
  "studio.reset": "Reset data",
  "studio.sync": "Sync to cloud",
  "studio.syncing": "Syncing...",
  "studio.synced": "Synced",
  "studio.retry": "Retry",
  "studio.newFromPhotos": "New from photos",
  "studio.hideVision": "Hide vision upload",
  "studio.publish": "Publish",
  "studio.current": "CURRENT",
  "studio.live": "LIVE",
  "studio.draft": "DRAFT",
  "studio.activity": "Activity",
  "studio.publicAtlas": "Public atlas",
  "studio.backProjects": "Projects",
  "studio.hidePanels": "Hide panels",
  "studio.showPanels": "Show panels",
  "studio.ready": "ready",
  "studio.needsHero": "need a hero",
  "publish.title": "Publish project",
  "publish.back": "Back to workspace",
  "publish.liveNow": "Live now",
  "publish.preflight": "Pre-flight",
  "publish.ready": "ready",
  "publish.allClear": "all clear",
  "publish.needAttention": "need attention",
  "publish.publicUrl": "Public URL",
  "publish.visibility": "Visibility",
  "publish.unpublish": "Unpublish",
  "publish.copyPublic": "Copy public link",
  "publish.openPublic": "Open public project",
  "publish.submit": "Publish",
  "publish.blocked": "issue(s) block publish",
  "publish.published": "Published",
  "publish.unpublished": "Unpublished",
  "publish.linkCopied": "Link copied",
  "atlas.title": "{count} stops, two cities.",
  "atlas.body": "MapLibre-rendered atlas with mode-aware tile styles. Fashion uses CARTO voyager, cinema uses dark-matter, punk uses a desaturated light base with a red zine scrim.",
  "atlas.switchHint": "SWITCH NARRATIVE MODE TO SEE THE ATLAS RE-TILE",
} as const;

type UiKey = keyof typeof UI_EN;

const UI_ZH: Record<UiKey, string> = {
  "language.label": "语言",
  "language.en": "English",
  "language.zh": "中文",
  "common.loading": "加载中...",
  "common.error": "出了点问题。",
  "common.back": "返回",
  "common.close": "关闭",
  "common.copyLink": "复制链接",
  "common.open": "打开",
  "common.unknown": "未知",
  "mode.label": "叙事模式",
  "mode.punk": "朋克",
  "mode.fashion": "时装",
  "mode.cinema": "电影",
  "public.publishedVia": "通过 London Cuts 发布",
  "public.atlasAria": "这个项目的地图集",
  "public.atlasLink": "地图集",
  "public.atlasLinkAria": "浏览所有项目的地图集",
  "public.stopsAria": "这个项目的站点",
  "public.stops": "个站点",
  "public.noHero": "还没有主图",
  "public.reads": "次阅读",
  "public.stop": "站点",
  "public.openPostcard": "打开明信片",
  "public.backToProject": "返回项目",
  "public.lastStop": "最后一站",
  "public.draftChapter": "这一章还在草稿中。",
  "public.backToChapter": "返回章节",
  "public.postcard": "明信片",
  "public.pngFront": "正面 PNG",
  "public.pngBack": "背面 PNG",
  "public.pdf": "PDF",
  "public.exporting": "导出中...",
  "public.noPostcardFront": "这张明信片还没有正面图片。",
  "notFound.eyebrow": "这里暂时没有内容",
  "notFound.suffix": "不在这个浏览器里。",
  "notFound.body": "London Cuts 仍处于公开 beta。公开项目会优先从云端读取；如果没有云端内容，这个浏览器可能没有该链接背后的本地草稿数据。",
  "notFound.openAtlas": "打开地图集",
  "notFound.enterStudio": "进入创作室",
  "auth.signInEyebrow": "London Cuts - 登录",
  "auth.signInTitle": "用邮箱登录。",
  "auth.sentTitle": "请查收邮箱。",
  "auth.email": "邮箱",
  "auth.sendMagic": "发送魔法链接",
  "auth.sending": "发送中...",
  "auth.rateLimited": "邮件发送暂时受限。请稍等一会儿再请求新的登录链接。",
  "auth.sendFailed": "无法发送登录链接",
  "auth.requestFailed": "请求失败",
  "auth.sentBody": "我们已向 {email} 发送一次性链接。请点击收件箱里的链接完成登录。",
  "auth.sentHelp": "一分钟后还没收到？请检查垃圾邮件，或在下面换一个邮箱。",
  "auth.useDifferent": "换一个邮箱",
  "auth.passwordless": "不需要记密码。我们会给你发送登录链接。首次登录还需要项目 owner 给的邀请码。",
  "onboarding.eyebrow": "London Cuts - 欢迎",
  "onboarding.title": "设置你的旅行日志。",
  "onboarding.checking": "正在检查登录状态...",
  "onboarding.signInFirst": "请先登录。完成后我们会带你回到这里。",
  "onboarding.goSignIn": "去登录",
  "onboarding.already": "你已经设置为 @{handle}。",
  "onboarding.openStudio": "打开创作室",
  "onboarding.signedIn": "已用 {email} 登录。开始写作前还需要三件小事。",
  "onboarding.name": "你的名字",
  "onboarding.nameHelp": "会显示在你发布的页面上，像署名一样。之后可以修改。",
  "onboarding.pageAddress": "你的页面地址",
  "onboarding.pageHelp": "分享旅行时出现在链接里的短名字。只能用小写字母、数字或连字符。",
  "onboarding.invite": "邀请码",
  "onboarding.inviteHelp": "邀请你的人给你的代码。每个邀请码对应一个人，在这里输入以激活账号。",
  "onboarding.start": "开始写作",
  "onboarding.settingUp": "设置中...",
  "onboarding.privateNote": "这些现在都还不会公开。你发布旅行时才会决定分享什么。",
  "studio.title": "London Cuts 创作室",
  "studio.projects": "项目",
  "studio.newProject": "新项目",
  "studio.yourWork": "你的作品。",
  "studio.reset": "重置数据",
  "studio.sync": "同步到云端",
  "studio.syncing": "同步中...",
  "studio.synced": "已同步",
  "studio.retry": "重试",
  "studio.newFromPhotos": "从照片新建",
  "studio.hideVision": "隐藏照片上传",
  "studio.publish": "发布",
  "studio.current": "当前",
  "studio.live": "已上线",
  "studio.draft": "草稿",
  "studio.activity": "动态",
  "studio.publicAtlas": "公开地图集",
  "studio.backProjects": "项目",
  "studio.hidePanels": "隐藏面板",
  "studio.showPanels": "显示面板",
  "studio.ready": "已就绪",
  "studio.needsHero": "需要主图",
  "publish.title": "发布项目",
  "publish.back": "返回工作区",
  "publish.liveNow": "已上线",
  "publish.preflight": "发布前检查",
  "publish.ready": "已就绪",
  "publish.allClear": "全部通过",
  "publish.needAttention": "需要处理",
  "publish.publicUrl": "公开 URL",
  "publish.visibility": "可见性",
  "publish.unpublish": "取消发布",
  "publish.copyPublic": "复制公开链接",
  "publish.openPublic": "打开公开项目",
  "publish.submit": "发布",
  "publish.blocked": "项问题阻止发布",
  "publish.published": "已发布",
  "publish.unpublished": "已取消发布",
  "publish.linkCopied": "链接已复制",
  "atlas.title": "{count} 个站点，两座城市。",
  "atlas.body": "MapLibre 地图集会随叙事模式切换底图。时装模式使用 CARTO voyager，电影模式使用 dark-matter，朋克模式使用去饱和浅色底图和红色 zine 风格罩层。",
  "atlas.switchHint": "切换叙事模式可以看到地图重新换肤",
};

const UI = { en: UI_EN, zh: UI_ZH } as const;

export function t(locale: Locale, key: UiKey, vars: Record<string, string | number> = {}): string {
  const template = UI[locale][key] ?? UI.en[key];
  return Object.entries(vars).reduce(
    (out, [name, value]) => out.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function localeName(locale: Locale): string {
  return locale === "zh" ? "中文" : "English";
}

export function localizedField<T extends Record<string, unknown>, K extends keyof T>(
  locale: Locale,
  base: T[K],
  translations: Localized<T> | null | undefined,
  key: K,
): T[K] {
  if (locale === "en") return base;
  const value = translations?.[locale]?.[key];
  return value == null ? base : (value as T[K]);
}

export function localizeBodyBlocks(
  locale: Locale,
  base: readonly BodyBlock[],
  translations: Localized<StopTranslation> | null | undefined,
): readonly BodyBlock[] {
  if (locale === "en") return base;
  return translations?.[locale]?.body ?? base;
}

function zhBody(meta: readonly string[], paragraph: string, pullQuote: string, caption: string, assetId: string): readonly BodyBlock[] {
  return [
    { type: "metaRow", content: meta },
    { type: "heroImage", assetId, caption },
    { type: "paragraph", content: paragraph },
    { type: "pullQuote", content: pullQuote },
  ];
}

export const SEED_PROJECT_TRANSLATIONS: Record<string, Localized<ProjectTranslation>> = {
  "a-year-in-se1": {
    zh: {
      title: "伦敦周游一年",
      subtitle: "十三张带 EXIF 线索的照片，穿过伦敦、温莎和其间的路。",
      description: "一组以照片、地点和时间为锚点的伦敦旅行故事。",
      locationName: "伦敦、温莎及周边",
      coverLabel: "伦敦 · 温莎 · 希思罗",
      tags: ["伦敦", "温莎", "照片日记"],
      duration: "约 48 分钟阅读",
      author: "Ana Ishii",
    },
  },
  "a-week-in-reykjavik": {
    zh: {
      title: "雷克雅未克一周",
      subtitle: "七次从港口到温泉池的冬日步行。",
      description: "一组关于雷克雅未克冬日步行、港口玻璃和蓝色时刻的旅行故事。",
      locationName: "雷克雅未克，冰岛",
      coverLabel: "雷克雅未克 · 极光",
      tags: ["雷克雅未克", "冰岛", "冬季"],
      duration: "约 32 分钟阅读",
      author: "Sigrún Jónsdóttir",
    },
  },
};

export const SEED_STOP_TRANSLATIONS: Record<string, Localized<StopTranslation>> = {
  "a-year-in-se1:01": { zh: { title: "摄政街灯饰", time: "20:50", mood: "节庆", code: "W1B 4NF", label: "梅费尔的魔法灯光", body: zhBody(["20:50", "2026 年 1 月 1 日", "W1B 4NF", "梅费尔的魔法灯光"], "夜幕落在摄政街上，圣诞灯饰逐一亮起。天使般的光影悬在繁忙街道上方，把伦敦市中心的节日情绪推到眼前。", "伦敦中心的一片节庆梦境。", "摄政街的圣诞灯饰照亮夜晚。", "se1-01") } },
  "a-year-in-se1:02": { zh: { title: "隔着玻璃", time: "13:51", mood: "宁静", code: "N6 5UL", label: "Muswell Hill 窗景", body: zhBody(["13:51", "2025 年 8 月 21 日", "N6 5UL", "Muswell Hill 窗景"], "纹理玻璃把外面的绿意变得柔软。光线穿过窗面，像把 Muswell Hill 的日常安静地框进屋内。", "自然的美刚好被框住。", "透过纹理窗户看到的宁静景色。", "se1-02") } },
  "a-year-in-se1:03": { zh: { title: "Tufnell Park 地铁站", time: "13:35", mood: "通勤", code: "N19 5AA", label: "Tufnell Park 站台", body: zhBody(["13:35", "2025 年 8 月 23 日", "N19 5AA", "Tufnell Park 站台"], "Tufnell Park 的地下站台在等待中停顿。广告、瓷砖和列车灯光都很忙，但这一刻仍像被城市节奏短暂托住。", "城市节拍里的一次暂停。", "Tufnell Park 站台上的伦敦通勤瞬间。", "se1-03") } },
  "a-year-in-se1:04": { zh: { title: "守卫传统", time: "08:39", mood: "历史", code: "SL4 1QF", label: "温莎卫兵", body: zhBody(["08:39", "2025 年 9 月 9 日", "SL4 1QF", "温莎卫兵"], "温莎城堡的庭院里，卫兵以仪式感穿过石墙之间。红色制服和熊皮帽把一个游客的早晨突然变得庄重而古老。", "传统仍在行进。", "温莎城堡卫兵正在执勤。", "se1-04") } },
  "a-year-in-se1:05": { zh: { title: "安静的退隐处", time: "10:23", mood: "平静", code: "SL4 1LB", label: "Cornwall Tower", body: zhBody(["10:23", "2025 年 9 月 9 日", "SL4 1LB", "Cornwall Tower"], "温莎城堡内部，石拱和柔光形成一个从仪式转向午餐的停顿。古老砖面下的桌椅让塔楼像一间暂时避开的房间。", "温莎的一次安静逃离。", "Cornwall Tower 内部的宁静空间。", "se1-05") } },
  "a-year-in-se1:06": { zh: { title: "成就的庆祝", time: "15:05", mood: "喜悦", code: "WC2N 6PB", label: "毕业典礼人群", body: zhBody(["15:05", "2025 年 9 月 11 日", "WC2N 6PB", "毕业典礼人群"], "Golden Jubilee Bridge 附近，一群正式着装的人在白日中聚集。长袍、西装和手机让人行道也带上了典礼感。", "值得记住的一刻。", "桥边庆祝的人群。", "se1-06") } },
  "a-year-in-se1:07": { zh: { title: "城市表情", time: "17:08", mood: "色彩", code: "TW5 9GX", label: "Hounslow 街头艺术", body: zhBody(["17:08", "2025 年 9 月 13 日", "TW5 9GX", "Hounslow 街头艺术"], "Hounslow 的通道被涂鸦和层叠颜料填满。一个普通路线突然像小型城市画廊，私人标记把目光往深处拉。", "艺术在无声处说话。", "Hounslow 通道里的彩色涂鸦。", "se1-07") } },
  "a-year-in-se1:08": { zh: { title: "夜里的城市灯光", time: "18:31", mood: "宁静", code: "SE10 0JH", label: "格林尼治半岛", body: zhBody(["18:31", "2025 年 9 月 27 日", "SE10 0JH", "格林尼治半岛"], "格林尼治半岛的夜色里，城市灯光掠过水面。楼群和倒影沿河岸叠成明亮边缘，前景却仍适合慢慢散步。", "城市在夜空下闪光。", "格林尼治半岛夜景。", "se1-08") } },
  "a-year-in-se1:09": { zh: { title: "抵达希思罗", time: "18:03", mood: "忙碌", code: "TW6 1FB", label: "英国边检队伍", body: zhBody(["18:03", "2025 年 11 月 20 日", "TW6 1FB", "英国边检队伍"], "希思罗把抵达的最初几分钟压缩成行李、外套和护照检查的队列。城市还没正式开始，却已经在等待里出现。", "兴奋在空气里挤着前进。", "希思罗机场英国边检的忙碌场景。", "se1-09") } },
  "a-year-in-se1:10": { zh: { title: "国王十字的餐食", time: "17:14", mood: "温暖", code: "N1C 4DQ", label: "摄政运河旁的餐桌", body: zhBody(["17:14", "2025 年 5 月 30 日", "N1C 4DQ", "摄政运河旁的餐桌"], "在国王十字的摄政运河边，餐厅柜台成了整个场景。手写菜单、冷水、金属架和服务员的动作组成了晚餐的小型编舞。", "感官的一次盛宴。", "摄政运河旁的餐厅瞬间。", "se1-10") } },
  "a-year-in-se1:11": { zh: { title: "皮卡迪利夜灯", time: "22:05", mood: "鲜活", code: "W1J 9HA", label: "梅费尔夜色", body: zhBody(["22:05", "2026 年 4 月 18 日", "W1J 9HA", "梅费尔夜色"], "夜里的皮卡迪利把交通变成移动的光桌。巴士、汽车和店面亮光聚在 BAFTA 立面周围，让梅费尔显得精致又不安分。", "伦敦夜生活自有电流。", "梅费尔夜晚的街道灯光。", "se1-11") } },
  "a-year-in-se1:12": { zh: { title: "城市中的力量", time: "18:23", mood: "能量", code: "WC1H 0AH", label: "Pulse Fitness 健身房", body: zhBody(["18:23", "2026 年 4 月 18 日", "WC1H 0AH", "Pulse Fitness 健身房"], "Gordon Street 附近的健身房明亮、实用、充满重复动作。器械、镜子和身体共享同一个房间，却各自追着不同目标。", "力量遇见共同体。", "Pulse Fitness 健身房的城市室内场景。", "se1-12") } },
  "a-year-in-se1:13": { zh: { title: "日落的宁静", time: "02:05", mood: "安宁", code: "N4 3NP", label: "Coleridge Road", body: zhBody(["02:05", "2025 年 7 月 6 日", "N4 3NP", "Coleridge Road"], "Coleridge Road 上，一片柔软的云接住最后的颜色。街道普通得近乎空白，于是天空成了主角。", "城市里一刻短暂的平静。", "Finsbury Park 附近 Coleridge Road 上的宁静晚霞。", "se1-13") } },
  "a-week-in-reykjavik:01": { zh: { title: "山顶的 Hallgrímskirkja", time: "09:18", mood: "石色", code: "101 RVK", label: "Hallgrímskirkja · 玄武岩", body: [] } },
  "a-week-in-reykjavik:02": { zh: { title: "港口旁的玻璃钻石 Harpa", time: "11:02", mood: "冰川", code: "101 RVK", label: "Harpa · 港口玻璃", body: [] } },
  "a-week-in-reykjavik:03": { zh: { title: "黎明时的 Sólfar 太阳航海者", time: "07:44", mood: "钢色", code: "101 RVK", label: "Sólfar · 冷钢", body: [] } },
  "a-week-in-reykjavik:04": { zh: { title: "周六的 Kolaportið", time: "12:30", mood: "羊毛", code: "101 RVK", label: "Kolaportið · 跳蚤市场", body: [] } },
  "a-week-in-reykjavik:05": { zh: { title: "Nauthólsvík 地热海滩", time: "14:15", mood: "火山", code: "101 RVK", label: "Nauthólsvík · 热沙", body: [] } },
  "a-week-in-reykjavik:06": { zh: { title: "天黑后的 Laugavegur", time: "22:08", mood: "霓虹", code: "101 RVK", label: "Laugavegur · 霓虹", body: [] } },
  "a-week-in-reykjavik:07": { zh: { title: "热水池里的 Vesturbæjarlaug 蓝调时刻", time: "16:52", mood: "极光", code: "107 RVK", label: "Vesturbæjarlaug · 蓝色时刻", body: [] } },
};

export const SEED_POSTCARD_TRANSLATIONS: Record<string, Localized<PostcardTranslation>> = {
  "a-year-in-se1:01": { zh: { message: "我很喜欢在节日灯光下慢慢走。那种气氛像被点亮了一样。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:02": { zh: { message: "我找到一个安静的位置看窗外。这里真的很平和。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:03": { zh: { message: "Tufnell Park 的能量很迷人。地铁总像一座小剧场。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:04": { zh: { message: "今天看见卫兵完整地经过。这个早晨太难忘了。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:05": { zh: { message: "我在温莎找到一处安静停顿。建筑自己就说了一半。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:06": { zh: { message: "今天路过桥边的典礼。整条人行道都像在骄傲。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:07": { zh: { message: "我找到一条满是颜色的小巷。像一间藏起来的小画廊。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:08": { zh: { message: "夜里沿河走了一段。灯光把所有工作都完成了。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:09": { zh: { message: "刚从希思罗抵达。城市在离开队伍之前就已经开始了。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:10": { zh: { message: "我在运河旁吃饭，看柜台围着晚餐移动。整个房间都带电。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:11": { zh: { message: "夜里的伦敦还是很有电流。皮卡迪利像为自己盛装了一样。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:12": { zh: { message: "在 Gordon Street 附近找到一小块专注。每个人都按自己的节奏移动。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
  "a-year-in-se1:13": { zh: { message: "我在 Coleridge Road 为天空停下。它普通，又美得很短暂。", recipient: { name: "M.", line1: "温暖的某处", line2: "留局待取", country: "世界" } } },
};

export const SEED_ASSET_TRANSLATIONS: Record<string, Localized<AssetTranslation>> = {
  "se1-01": { zh: { alt: "摄政街圣诞灯饰照亮夜晚。", caption: "摄政街的圣诞灯饰" } },
  "se1-02": { zh: { alt: "透过纹理玻璃看到的安静绿意。", caption: "Muswell Hill 的窗景" } },
  "se1-03": { zh: { alt: "Tufnell Park 地铁站台上的伦敦通勤瞬间。", caption: "Tufnell Park 地铁站" } },
  "se1-04": { zh: { alt: "温莎城堡卫兵在石墙前列队执勤。", caption: "温莎卫兵" } },
  "se1-05": { zh: { alt: "Cornwall Tower 内部的石拱和安静桌椅。", caption: "Cornwall Tower 的宁静空间" } },
  "se1-06": { zh: { alt: "Golden Jubilee Bridge 附近庆祝毕业的人群。", caption: "桥边的毕业庆祝" } },
  "se1-07": { zh: { alt: "Hounslow 通道里层叠的彩色涂鸦。", caption: "Hounslow 街头艺术" } },
  "se1-08": { zh: { alt: "格林尼治半岛夜色中的河岸灯光和倒影。", caption: "格林尼治半岛夜景" } },
  "se1-09": { zh: { alt: "希思罗机场英国边检处排队的人群。", caption: "希思罗抵达队伍" } },
  "se1-10": { zh: { alt: "国王十字摄政运河旁忙碌而温暖的餐厅柜台。", caption: "摄政运河旁的餐桌" } },
  "se1-11": { zh: { alt: "皮卡迪利夜晚的街道、车灯和店面亮光。", caption: "梅费尔夜色" } },
  "se1-12": { zh: { alt: "Gordon Street 附近明亮而专注的健身房室内。", caption: "Pulse Fitness 健身房" } },
  "se1-13": { zh: { alt: "Coleridge Road 上方柔和的日落云色。", caption: "Coleridge Road 的晚霞" } },
};
