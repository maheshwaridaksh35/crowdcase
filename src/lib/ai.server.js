// Server-only model adapter for CrowdCase AI analysis.
// API credentials are deliberately provided by the host's Base44 server context;
// no private model key is shipped in the browser bundle.
export function gatewayModel(base44, modelName = "automatic") {
  const candidate = base44?.ai?.models?.[modelName]
    || base44?.ai?.models?.automatic
    || base44?.ai?.model;
  if (!candidate) {
    throw new Error("The configured Base44 AI model gateway is unavailable in this deployment. Keep the labelled heuristic fallback visible.");
  }
  return candidate;
}
