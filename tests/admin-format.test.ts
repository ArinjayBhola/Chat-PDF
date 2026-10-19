import { test } from "node:test";
import assert from "node:assert/strict";
import { adminDate } from "../lib/admin-format";
test("timestamps cross midnight into the correct IST date",()=>{
 assert.equal(adminDate("2026-10-19T20:00:00Z"),"20-10-2026 01:30 IST");
 assert.equal(adminDate("2026-10-19 20:00:00"),"20-10-2026 01:30 IST");
 assert.equal(adminDate(new Date("2026-10-19T20:00:00Z")),"20-10-2026 01:30 IST");
});
test("calendar dates use dd-mm-yyyy without shifting the date",()=>{
 assert.equal(adminDate("2026-01-02",false),"02-01-2026");
 assert.equal(adminDate("2026-12-31",false),"31-12-2026");
});
test("missing or invalid dates are handled",()=>{
 assert.equal(adminDate(null),"Not recorded");
 assert.equal(adminDate("invalid"),"Not recorded");
});
