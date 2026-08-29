# Grouped Polish Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Combine content-consented `polish-section` records from the same draft work into one admin record without changing user-visible pages.

**Architecture:** The draft client sends its existing per-draft UUID as a request header only for the polish endpoint. Route helpers persist it as optional `workId` in collection JSONL. The admin records reader groups only `polish-section` records with equal `workId`, creates an opaque group ID, and expands that group into section-by-section content after the existing password check.

**Tech Stack:** Next.js App Router, React, TypeScript, Node `node:test`, JSONL file storage.

## Global Constraints

- Only `/admin` changes visually; user pages, copy, flow, and collection checkbox remain unchanged.
- Only consented content records may include a `workId`; analytics events remain content-free.
- 8083 must not be changed; production deploy target is `highauto` / 3007 → 8085.
- Old records without `workId` remain individual records.

---

### Task 1: Grouped record reader

**Files:**
- Modify: `lib/admin-records.ts`
- Test: `tests/analytics-core.test.mjs`

**Interfaces:**
- Produces `groupCollectionRecords(records: CollectionRecord[]): CollectionRecordSummary[]`.
- Produces `getCollectionRecord(id)` capable of returning either one record or a grouped polish detail.

- [ ] **Step 1: Write the failing test**

```js
const summaries = groupCollectionRecords([
  polish("work-1", "研究目标"), polish("work-1", "研究内容"), polish("work-2", "研究目标")
]);
assert.equal(summaries.length, 2);
assert.match(summaries[0].action, /逐栏打磨/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/analytics-core.test.mjs`

Expected: failure because `groupCollectionRecords` is unavailable.

- [ ] **Step 3: Implement the minimal grouping and group-detail ID decoding**

```ts
if (entry.action === "polish-section" && entry.workId) {
  // group by workId, preserve every section record for detail display
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/analytics-core.test.mjs`

Expected: PASS.

### Task 2: Persist the draft work ID

**Files:**
- Modify: `lib/data-collection.ts`
- Modify: `lib/route-helpers.ts`
- Modify: `lib/utils.ts`
- Modify: `components/DraftSteps.tsx`
- Test: `tests/collection-consent.test.mjs`

**Interfaces:**
- `postAiStream(..., allowCollection, workId?)` sends `x-work-id` only when supplied.
- `CollectionEntry.workId?: string` persists only through consented content writes.

- [ ] **Step 1: Write the failing test**

```js
assert.equal(sanitizeWorkId("draft_1234567890"), "draft_1234567890");
assert.equal(sanitizeWorkId("bad id"), undefined);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/collection-consent.test.mjs`

Expected: failure because `sanitizeWorkId` is unavailable.

- [ ] **Step 3: Implement header validation and pass `sessionId.current` for polish calls only**

```ts
headers["x-work-id"] = workId;
await postAiStream("/api/polish-section", payload, onChunk, allowCollection, sessionId.current);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/collection-consent.test.mjs`

Expected: PASS.

### Task 3: Admin group display and verification

**Files:**
- Modify: `app/api/admin/records/[id]/route.ts`
- Modify: `app/admin/page.tsx`
- Test: `tests/admin-detail-placement.test.mjs`

**Interfaces:**
- Detail response adds optional `groupedItems: Array<{ section: string; input: Record<string, unknown>; outputText: string }>`.
- The selected record card renders every grouped item under that same card.

- [ ] **Step 1: Write the failing test**

```js
assert.ok(source.includes("selectedRecord.groupedItems"));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/admin-detail-placement.test.mjs`

Expected: assertion failure.

- [ ] **Step 3: Render grouped section details in the selected card**

```tsx
{selectedRecord.groupedItems?.map((item) => <section key={item.section}>…</section>)}
```

- [ ] **Step 4: Run full verification**

Run: `node --experimental-strip-types --test tests/analytics-core.test.mjs tests/collection-consent.test.mjs && node --test tests/admin-detail-placement.test.mjs && npx tsc --noEmit && npm run build`

Expected: all tests pass and Next production build succeeds.
