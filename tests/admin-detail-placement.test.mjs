import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("renders a selected record detail inside the clicked record card", () => {
  const source = fs.readFileSync(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  const mapStart = source.indexOf("{records.map((record) => (");
  const mapEnd = source.indexOf("))}", mapStart);
  const selectedInsideMap = source.indexOf("selectedRecord?.id === record.id", mapStart);

  assert.ok(mapStart >= 0 && mapEnd > mapStart, "record list map should exist");
  assert.ok(selectedInsideMap > mapStart && selectedInsideMap < mapEnd, "selected detail should render beneath its matching record");
});

test("renders every grouped polish section in the selected record card", () => {
  const source = fs.readFileSync(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(source, /selectedRecord\.groupedItems\?\.map/);
});

test("uses a draft-specific work id for polish requests instead of the export session id", () => {
  const source = fs.readFileSync(new URL("../components/DraftSteps.tsx", import.meta.url), "utf8");
  assert.match(source, /polishWorkSource\.current !== draft/);
  assert.match(source, /allowCollection, workId\.current\);/);
});
