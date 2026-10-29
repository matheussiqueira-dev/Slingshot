export const API_BASE_META_NAME = "slingshot-api-base";

export function resolveApiBaseUrl(doc) {
  const meta = doc?.querySelector?.(`meta[name="${API_BASE_META_NAME}"]`);
  const value = (meta?.getAttribute("content") || "").trim();

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}
