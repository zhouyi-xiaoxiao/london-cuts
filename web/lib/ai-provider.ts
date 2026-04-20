// AI generation seam (OpenAI today; wrapper so we can swap).
// M-fast: client-side fetch with user-pasted key (same as legacy app/).
// M2: move to server-side API route at /api/ai/generate with owner key.
import { NotImplementedError } from "./errors";

export type PostcardStyle =
  | "watercolour"
  | "vintage_poster"
  | "risograph"
  | "ink_watercolour"
  | "anime"
  | "art_nouveau";

export interface GeneratePostcardInput {
  userId: string;
  sourceAssetId: string;
  style: PostcardStyle;
  prompt?: string;
}

export interface GeneratePostcardResult {
  resultAssetId: string;
  cached: boolean;
}

export async function generatePostcardArt(
  _input: GeneratePostcardInput,
): Promise<GeneratePostcardResult> {
  throw new NotImplementedError("generatePostcardArt");
}

export interface VisionAnalysisResult {
  title: string;
  body: string;
  excerpt: string;
  postcardMessage: string;
}

export async function describePhoto(
  _assetId: string,
): Promise<VisionAnalysisResult> {
  throw new NotImplementedError("describePhoto");
}
