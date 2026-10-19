import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAdminAccess, providerErrorCategory, storageThreshold } from "../lib/admin-policy";
test("admin access fails closed for anonymous, ordinary accounts, or missing configuration", () => {
 assert.equal(hasAdminAccess(undefined, "owner@example.com"), false);
 assert.equal(hasAdminAccess({id:"ordinary",email:"user@example.com"}, "owner@example.com"), false);
 assert.equal(hasAdminAccess({id:"owner",email:"owner@example.com"}, ""), false);
 assert.equal(hasAdminAccess({email:"owner@example.com"}, "owner@example.com"), false);
 assert.equal(hasAdminAccess({id:"attacker",email:"owner@example.com.evil.test"}, "owner@example.com"), false);
});
test("only exact configured admin emails pass, with case and whitespace normalization", () => {
 assert.equal(hasAdminAccess({id:"owner",email:"Owner@Example.com"}, " other@example.com, owner@example.com "), true);
});
test("storage configuration rejects absent, invalid, negative and zero limits", () => {
 for (const v of [undefined,"","NaN","Infinity","0","-1"]) assert.equal(storageThreshold(v,10),10);
 assert.equal(storageThreshold("25",10),25);
});
test("provider errors retain only a safe category", () => {
 assert.equal(providerErrorCategory({statusCode:429,responseBody:"private document"}),"rate_limit");
 assert.equal(providerErrorCategory({statusCode:401}),"authentication");
 assert.equal(providerErrorCategory({statusCode:503}),"provider_unavailable");
 assert.equal(providerErrorCategory({statusCode:400}),"request_rejected");
 assert.equal(providerErrorCategory(new Error("secret key and prompt")),"stream_or_network");
});
