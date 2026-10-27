/* Dispute-time image-provenance check. Reverse-image / web-detection to see whether
   a submitted photo also appears elsewhere online. Advisory and consented only — a
   match is never proof of fraud, and nothing runs without explicit consent. */

export type ProvenanceStatus = "not_run" | "unavailable" | "completed";

export interface ProvenanceResult {
  image_ref: string;
  sources_found: number;
  sources: string[];
  note: string;
}

export interface ProvenanceReport {
  status: ProvenanceStatus;
  reason?: string;
  results: ProvenanceResult[];
}

export async function runImageProvenance(opts: { consent: boolean; images: string[] }): Promise<ProvenanceReport> {
  // Privacy gate: never send a private photo to a third party without consent.
  if (!opts.consent) {
    return { status: "not_run", reason: "No consent to send photos to an external reverse-image service.", results: [] };
  }

  const key = process.env.IMAGE_PROVENANCE_API_KEY;
  if (!key) {
    return {
      status: "unavailable",
      reason: "Image-provenance provider is not configured (set IMAGE_PROVENANCE_API_KEY).",
      results: [],
    };
  }

  // A real provider (Google Vision Web Detection, TinEye, SerpAPI) would be called here,
  // sending only the disputed photos and returning the pages they appear on. We do not
  // fabricate matches, so until a provider adapter is wired this stays honestly unavailable.
  return {
    status: "unavailable",
    reason: "Provider key present, but no reverse-image provider adapter is wired yet.",
    results: [],
  };
}
