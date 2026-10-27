import "server-only";

import { createHash } from "node:crypto";
import type { ListingDraft, ListingVerdict } from "@/lib/listingCheck";

const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 250;
type ImageChecks = ListingVerdict["image_checks"];
const imageReviews = new Map<string, { checks: ImageChecks; expiresAt: number }>();

function imageReviewKey(draft: ListingDraft) {
  const hash = createHash("sha256");
  hash.update(JSON.stringify([draft.type, draft.item, draft.amount, draft.description]));
  for (const image of draft.images) {
    hash.update("\0");
    hash.update(image.name);
    hash.update("\0");
    hash.update(image.dataUrl);
  }
  return hash.digest("hex");
}

export function cacheImageReview(draft: ListingDraft, checks: ImageChecks) {
  const now = Date.now();
  for (const [key, entry] of imageReviews) if (entry.expiresAt <= now) imageReviews.delete(key);
  if (imageReviews.size >= MAX_ENTRIES) {
    const oldest = imageReviews.keys().next().value;
    if (oldest) imageReviews.delete(oldest);
  }
  imageReviews.set(imageReviewKey(draft), { checks, expiresAt: now + CACHE_TTL_MS });
}

export function getCachedImageReview(draft: ListingDraft): ImageChecks | null {
  const key = imageReviewKey(draft);
  const entry = imageReviews.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    imageReviews.delete(key);
    return null;
  }
  imageReviews.delete(key);
  imageReviews.set(key, entry);
  return entry.checks;
}
