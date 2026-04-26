import type { PublicProjectDTO } from "@/lib/public-content";

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
): AiVisibilityAuditDTO {
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
      message: "Project subtitle is empty.",
      recommendation: "Add a subtitle that says what the trip is and why it matters.",
    });
  }
  if (!project.locationName && project.places.length === 0) {
    missingMetadata.push("locationName");
    issues.push({
      severity: "warning",
      area: "metadata",
      message: "No explicit location or place list is available.",
      recommendation: "Add a project location and stop-level place names.",
    });
  }
  if (!project.publishedAt) {
    missingMetadata.push("publishedAt");
    issues.push({
      severity: "info",
      area: "metadata",
      message: "Published timestamp is missing.",
      recommendation: "Expose the publish date for fresher search snippets.",
    });
  }
  if (!project.coverImageUrl) {
    missingMetadata.push("coverImageUrl");
    issues.push({
      severity: "warning",
      area: "images",
      message: "Project has no public cover image.",
      recommendation: "Set a public cover asset so link previews and answer cards have an image.",
    });
  } else {
    strengths.push("Public cover image is available for social and AI previews.");
  }

  if (project.shortSummary.length < 80) {
    issues.push({
      severity: "warning",
      area: "content",
      message: "Short summary is too thin for answer engines.",
      recommendation: "Expand the short summary with location, angle, and stop count.",
    });
  } else {
    strengths.push("Short summary gives retrievers a concise project description.");
  }

  if (project.retrievalKeywords.length < 6) {
    issues.push({
      severity: "warning",
      area: "metadata",
      message: "Retrieval keyword coverage is low.",
      recommendation: "Add location, stop titles, moods, and creator terms to retrievalKeywords.",
    });
  } else {
    strengths.push("Retrieval keywords include project, place, and stop terms.");
  }

  if (project.featuredStops.length === 0) {
    issues.push({
      severity: "critical",
      area: "content",
      message: "No featured stops are exposed in the public DTO.",
      recommendation: "Expose the first few public stops with stable chapter URLs.",
    });
  }

  const stopsWithoutBody = project.stops.filter((stop) => !stop.bodyText.trim());
  if (stopsWithoutBody.length > 0) {
    weakCitations.push(
      `${stopsWithoutBody.length} stops have no body text for answer grounding.`,
    );
    issues.push({
      severity: "warning",
      area: "content",
      message: "Some stops lack body text.",
      recommendation: "Add short factual body copy for each public stop.",
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
      message: "Some stops do not expose coordinates.",
      recommendation: "Add public lat/lng only when exact coordinates are safe to disclose.",
    });
  } else if (project.stops.length > 0) {
    strengths.push("Stops expose coordinates for map and place understanding.");
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
      message: "Some public images have weak alt text.",
      recommendation: "Replace asset-id fallback alt text with factual visual descriptions.",
    });
  } else if (project.assets.length > 0) {
    strengths.push("Public images include useful alt/caption text.");
  }

  if (!project.markdown.includes("## Do-Not-Infer Notes")) {
    weakCitations.push("Markdown pack lacks do-not-infer notes.");
    issues.push({
      severity: "warning",
      area: "citations",
      message: "Markdown pack is missing explicit inference boundaries.",
      recommendation: "Include do-not-infer notes in the markdown citation pack.",
    });
  } else {
    strengths.push("Markdown citation pack includes explicit do-not-infer notes.");
  }

  const score = scoreFromIssues(issues);
  const recommendations = issues.map((issue) => ({
    area: issue.area,
    priority: issue.severity,
    action: issue.recommendation,
  }));

  return {
    object: "ai_visibility_audit",
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
    suggestedQueries: suggestedQueries(project),
    answerCards: answerCards(project),
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

function suggestedQueries(project: PublicProjectDTO): string[] {
  return uniqueClean([
    project.title,
    `${project.title} London Cuts`,
    `${project.authorName} ${project.title}`,
    ...project.places.map((place) => `${place} travel story`),
    ...project.featuredStops.slice(0, 4).map((stop) => `${project.title} ${stop.title}`),
    ...project.retrievalKeywords.slice(0, 8),
  ]).slice(0, 16);
}

function answerCards(project: PublicProjectDTO): AiVisibilityAnswerCardDTO[] {
  const featured = project.featuredStops.map((stop) => stop.title).join(", ");
  return [
    {
      question: `What is ${project.title}?`,
      answer: project.shortSummary,
      sourceUrl: project.canonicalUrl,
    },
    {
      question: `Where does ${project.title} take place?`,
      answer:
        project.places.length > 0
          ? `${project.title} is grounded in ${project.places.join(", ")}.`
          : "The public project does not expose a specific place list yet.",
      sourceUrl: project.canonicalUrl,
    },
    {
      question: `What are the key stops in ${project.title}?`,
      answer: featured
        ? `Featured public stops include ${featured}.`
        : "No featured stops are exposed yet.",
      sourceUrl: project.markdownUrl,
    },
    {
      question: `How should ${project.title} be cited?`,
      answer:
        "Use the canonical project URL for project-level claims and chapter URLs for stop-level claims.",
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
