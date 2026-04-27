import type { PublicProjectDTO } from "@/lib/public-content";
import type { Locale } from "@/lib/i18n";

export type AiVisibilitySeverity = "info" | "warning" | "critical";
export type AiVisibilityArea =
  | "metadata"
  | "content"
  | "images"
  | "citations"
  | "api";

export interface AiVisibilityIssueDTO {
  severity: AiVisibilitySeverity;
  area: AiVisibilityArea;
  message: string;
  recommendation: string;
}

export interface AiVisibilityAnswerCardDTO {
  question: string;
  answer: string;
  sourceUrl: string;
}

export interface AiVisibilityRecommendationDTO {
  area: AiVisibilityArea;
  priority: AiVisibilitySeverity;
  action: string;
}

export interface AiVisibilityAuditDTO {
  object: "ai_visibility_audit";
  locale: Locale;
  generatedAt: string;
  score: number;
  project: {
    handle: string;
    slug: string;
    title: string;
    canonicalUrl: string;
    markdownUrl: string;
    apiUrl: string;
  };
  suggestedQueries: readonly string[];
  answerCards: readonly AiVisibilityAnswerCardDTO[];
  missingMetadata: readonly string[];
  weakCitations: readonly string[];
  imageAltGaps: readonly string[];
  issues: readonly AiVisibilityIssueDTO[];
  strengths: readonly string[];
  recommendations: readonly AiVisibilityRecommendationDTO[];
}

export function auditPublicProjectVisibility(
  project: PublicProjectDTO,
  locale: Locale = project.locale,
): AiVisibilityAuditDTO {
  const zh = locale === "zh";
  const issues: AiVisibilityIssueDTO[] = [];
  const missingMetadata: string[] = [];
  const weakCitations: string[] = [];
  const imageAltGaps: string[] = [];
  const strengths: string[] = [];

  if (!project.subtitle) {
    missingMetadata.push("subtitle");
    issues.push({
      severity: "info",
      area: "metadata",
      message: zh ? "项目副标题为空。" : "Project subtitle is empty.",
      recommendation: zh
        ? "补充一句说明这段旅行是什么、为什么值得读的副标题。"
        : "Add a subtitle that says what the trip is and why it matters.",
    });
  }
  if (!project.locationName && project.places.length === 0) {
    missingMetadata.push("locationName");
    issues.push({
      severity: "warning",
      area: "metadata",
      message: zh
        ? "缺少明确地点或地点列表。"
        : "No explicit location or place list is available.",
      recommendation: zh
        ? "补充项目地点和每个站点的公开地点名称。"
        : "Add a project location and stop-level place names.",
    });
  }
  if (!project.publishedAt) {
    missingMetadata.push("publishedAt");
    issues.push({
      severity: "info",
      area: "metadata",
      message: zh ? "缺少发布时间。" : "Published timestamp is missing.",
      recommendation: zh
        ? "公开发布时间，让搜索摘要更容易判断内容新鲜度。"
        : "Expose the publish date for fresher search snippets.",
    });
  }
  if (!project.coverImageUrl) {
    missingMetadata.push("coverImageUrl");
    issues.push({
      severity: "warning",
      area: "images",
      message: zh ? "项目没有公开封面图。" : "Project has no public cover image.",
      recommendation: zh
        ? "设置一张公开封面资产，让链接预览和回答卡片有图可用。"
        : "Set a public cover asset so link previews and answer cards have an image.",
    });
  } else {
    strengths.push(
      zh
        ? "已有公开封面图，可用于社交预览和 AI 预览。"
        : "Public cover image is available for social and AI previews.",
    );
  }

  if (project.shortSummary.length < 80) {
    issues.push({
      severity: "warning",
      area: "content",
      message: zh
        ? "短摘要对回答引擎来说信息量偏少。"
        : "Short summary is too thin for answer engines.",
      recommendation: zh
        ? "在短摘要里补充地点、叙事角度和站点数量。"
        : "Expand the short summary with location, angle, and stop count.",
    });
  } else {
    strengths.push(
      zh
        ? "短摘要已经能给检索器一个清晰的项目描述。"
        : "Short summary gives retrievers a concise project description.",
    );
  }

  if (project.retrievalKeywords.length < 6) {
    issues.push({
      severity: "warning",
      area: "metadata",
      message: zh ? "检索关键词覆盖不足。" : "Retrieval keyword coverage is low.",
      recommendation: zh
        ? "把地点、站点标题、情绪词和作者相关词加入 retrievalKeywords。"
        : "Add location, stop titles, moods, and creator terms to retrievalKeywords.",
    });
  } else {
    strengths.push(
      zh
        ? "检索关键词已经覆盖项目、地点和站点相关词。"
        : "Retrieval keywords include project, place, and stop terms.",
    );
  }

  if (project.featuredStops.length === 0) {
    issues.push({
      severity: "critical",
      area: "content",
      message: zh
        ? "公开 DTO 没有暴露 featured stops。"
        : "No featured stops are exposed in the public DTO.",
      recommendation: zh
        ? "暴露前几个公开站点，并提供稳定章节 URL。"
        : "Expose the first few public stops with stable chapter URLs.",
    });
  }

  const stopsWithoutBody = project.stops.filter((stop) => !stop.bodyText.trim());
  if (stopsWithoutBody.length > 0) {
    weakCitations.push(
      zh
        ? `${stopsWithoutBody.length} 个站点缺少可用于回答 grounding 的正文。`
        : `${stopsWithoutBody.length} stops have no body text for answer grounding.`,
    );
    issues.push({
      severity: "warning",
      area: "content",
      message: zh ? "部分站点缺少正文。" : "Some stops lack body text.",
      recommendation: zh
        ? "为每个公开站点补充简短、事实性的正文。"
        : "Add short factual body copy for each public stop.",
    });
  }

  const stopsWithoutCoordinates = project.stops.filter(
    (stop) => stop.lat == null || stop.lng == null,
  );
  if (stopsWithoutCoordinates.length > 0) {
    missingMetadata.push("stop coordinates");
    issues.push({
      severity: "info",
      area: "metadata",
      message: zh ? "部分站点没有公开坐标。" : "Some stops do not expose coordinates.",
      recommendation: zh
        ? "只在精确坐标可以安全公开时补充 lat/lng。"
        : "Add public lat/lng only when exact coordinates are safe to disclose.",
    });
  } else if (project.stops.length > 0) {
    strengths.push(
      zh
        ? "站点已公开坐标，有助于地图和地点理解。"
        : "Stops expose coordinates for map and place understanding.",
    );
  }

  for (const asset of project.assets) {
    if (!asset.alt.trim() || asset.alt === asset.id || asset.alt.length < 8) {
      imageAltGaps.push(asset.id);
    }
  }
  if (imageAltGaps.length > 0) {
    issues.push({
      severity: "warning",
      area: "images",
      message: zh ? "部分公开图片的 alt 文本偏弱。" : "Some public images have weak alt text.",
      recommendation: zh
        ? "用事实性的视觉描述替换资产 ID fallback alt 文本。"
        : "Replace asset-id fallback alt text with factual visual descriptions.",
    });
  } else if (project.assets.length > 0) {
    strengths.push(
      zh
        ? "公开图片已经包含有用的 alt/caption 文本。"
        : "Public images include useful alt/caption text.",
    );
  }

  if (
    !project.markdown.includes("## Do-Not-Infer Notes") &&
    !project.markdown.includes("## 不要推断")
  ) {
    weakCitations.push(
      zh ? "Markdown 包缺少不要推断说明。" : "Markdown pack lacks do-not-infer notes.",
    );
    issues.push({
      severity: "warning",
      area: "citations",
      message: zh
        ? "Markdown 包缺少明确的推断边界。"
        : "Markdown pack is missing explicit inference boundaries.",
      recommendation: zh
        ? "在 Markdown 引用包中加入不要推断说明。"
        : "Include do-not-infer notes in the markdown citation pack.",
    });
  } else {
    strengths.push(
      zh
        ? "Markdown 引用包包含明确的不要推断说明。"
        : "Markdown citation pack includes explicit do-not-infer notes.",
    );
  }

  const score = scoreFromIssues(issues);
  const recommendations = issues.map((issue) => ({
    area: issue.area,
    priority: issue.severity,
    action: issue.recommendation,
  }));

  return {
    object: "ai_visibility_audit",
    locale,
    generatedAt: new Date().toISOString(),
    score,
    project: {
      handle: project.handle,
      slug: project.slug,
      title: project.title,
      canonicalUrl: project.canonicalUrl,
      markdownUrl: project.markdownUrl,
      apiUrl: project.apiUrl,
    },
    suggestedQueries: suggestedQueries(project, locale),
    answerCards: answerCards(project, locale),
    missingMetadata,
    weakCitations,
    imageAltGaps,
    issues,
    strengths,
    recommendations,
  };
}

function scoreFromIssues(issues: readonly AiVisibilityIssueDTO[]): number {
  const penalty = issues.reduce((sum, issue) => {
    if (issue.severity === "critical") return sum + 25;
    if (issue.severity === "warning") return sum + 10;
    return sum + 4;
  }, 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function suggestedQueries(project: PublicProjectDTO, locale: Locale): string[] {
  return uniqueClean([
    project.title,
    `${project.title} London Cuts`,
    `${project.authorName} ${project.title}`,
    ...project.places.map((place) =>
      locale === "zh" ? `${place} 旅行故事` : `${place} travel story`,
    ),
    ...project.featuredStops.slice(0, 4).map((stop) => `${project.title} ${stop.title}`),
    ...project.retrievalKeywords.slice(0, 8),
  ]).slice(0, 16);
}

function answerCards(
  project: PublicProjectDTO,
  locale: Locale,
): AiVisibilityAnswerCardDTO[] {
  const zh = locale === "zh";
  const featured = project.featuredStops.map((stop) => stop.title).join(", ");
  return [
    {
      question: zh ? `${project.title} 是什么？` : `What is ${project.title}?`,
      answer: project.shortSummary,
      sourceUrl: project.canonicalUrl,
    },
    {
      question: zh
        ? `${project.title} 发生在哪里？`
        : `Where does ${project.title} take place?`,
      answer:
        project.places.length > 0
          ? zh
            ? `${project.title} 以 ${project.places.join(", ")} 为主要地点。`
            : `${project.title} is grounded in ${project.places.join(", ")}.`
          : zh
            ? "公开项目暂未暴露具体地点列表。"
            : "The public project does not expose a specific place list yet.",
      sourceUrl: project.canonicalUrl,
    },
    {
      question: zh
        ? `${project.title} 的关键站点有哪些？`
        : `What are the key stops in ${project.title}?`,
      answer: featured
        ? zh
          ? `公开 featured stops 包括 ${featured}。`
          : `Featured public stops include ${featured}.`
        : zh
          ? "暂未暴露 featured stops。"
          : "No featured stops are exposed yet.",
      sourceUrl: project.markdownUrl,
    },
    {
      question: zh
        ? `应该如何引用 ${project.title}？`
        : `How should ${project.title} be cited?`,
      answer:
        zh
          ? "项目级陈述引用 canonical 项目 URL；站点级事实引用对应章节 URL。"
          : "Use the canonical project URL for project-level claims and chapter URLs for stop-level claims.",
      sourceUrl: project.markdownUrl,
    },
  ];
}

function uniqueClean(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}
