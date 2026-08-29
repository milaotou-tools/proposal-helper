const WORK_ID_PATTERN = /^[a-zA-Z0-9_-]{10,128}$/;

export function sanitizeWorkId(value: string | null | undefined): string | undefined {
  return value && WORK_ID_PATTERN.test(value) ? value : undefined;
}
