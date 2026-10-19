import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { migrationStatements } from "../lib/migration-statements";
test("semicolons inside full-line comments do not become SQL statements", () => {
 const statements = migrationStatements("-- Preserve UTC aggregates; create IST data separately.\nCREATE TABLE example (id text);\n-- Historical data\nINSERT INTO example VALUES ('ok');");
 assert.deepEqual(statements,["CREATE TABLE example (id text)","INSERT INTO example VALUES ('ok')"]);
});
test("IST migration produces exactly the create and backfill statements", () => {
 const statements = migrationStatements(readFileSync(new URL("../drizzle/0004_admin_ist.sql", import.meta.url),"utf8"));
 assert.equal(statements.length,2);
 assert.match(statements[0],/^CREATE TABLE IF NOT EXISTS daily_activity_ist/);
 assert.match(statements[1],/^INSERT INTO daily_activity_ist/);
});

test("marked migrations preserve procedural SQL bodies", () => {
 const statements=migrationStatements(readFileSync(new URL("../drizzle/0005_account_deletion.sql",import.meta.url),"utf8"));
 assert.equal(statements.filter(s=>s.startsWith("CREATE OR REPLACE FUNCTION")).length,1);
 assert.match(statements.find(s=>s.startsWith("CREATE OR REPLACE FUNCTION"))!,/END \$\$;/);
});
