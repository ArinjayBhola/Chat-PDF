// These migrations contain simple SQL statements and full-line comments.
// Remove those comments before splitting: a comment may itself contain a semicolon.
export function migrationStatements(source: string) {
 if (source.includes("--> statement-breakpoint")) return source.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
 return source.replace(/^\s*--[^\r\n]*/gm, "").split(";").map(s => s.trim()).filter(Boolean);
}
