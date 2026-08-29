import test from "node:test";
import assert from "node:assert/strict";
import { resolveCollectionConsent } from "../lib/collection-consent.ts";
import { sanitizeWorkId } from "../lib/work-id.ts";

test("an explicit opt-out header overrides a route fallback", () => {
  assert.equal(resolveCollectionConsent("0", true), false);
  assert.equal(resolveCollectionConsent("1", false), true);
  assert.equal(resolveCollectionConsent(null, false), false);
});

test("an entry without a visible consent choice can opt out of content storage", () => {
  assert.equal(resolveCollectionConsent("0", true), false);
});

test("accepts a draft work id but rejects malformed request headers", () => {
  assert.equal(sanitizeWorkId("draft_1234567890"), "draft_1234567890");
  assert.equal(sanitizeWorkId("bad work id"), undefined);
});
