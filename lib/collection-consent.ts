export function resolveCollectionConsent(header: string | null, fallback?: boolean) {
  if (header === "1") return true;
  if (header === "0") return false;
  return typeof fallback === "boolean" ? fallback : true;
}
