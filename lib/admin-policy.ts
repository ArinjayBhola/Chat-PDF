export function hasAdminAccess(user: { id?: string; email?: string | null } | undefined, allowlist: string) {
 const emails = allowlist.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
 return !!user?.id && !!user.email && emails.includes(user.email.toLowerCase());
}
export function storageThreshold(value: string | undefined, fallback: number) {
 const n = Number(value);
 return Number.isFinite(n) && n > 0 ? n : fallback;
}
export function providerErrorCategory(error: unknown) {
 const status = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
 if (status === 429) return "rate_limit";
 if (status === 401 || status === 403) return "authentication";
 if (status >= 500 && status <= 599) return "provider_unavailable";
 if (status >= 400 && status <= 499) return "request_rejected";
 return "stream_or_network";
}
