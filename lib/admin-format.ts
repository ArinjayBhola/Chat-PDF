const ist = "Asia/Kolkata";
export function adminDate(value: unknown, withTime = true) {
 if (!value) return "Not recorded";
 // PostgreSQL timestamp-without-time-zone values represent UTC instants.
 let input = value instanceof Date ? value : String(value);
 if (typeof input === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(input) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(input)) input = input.replace(" ","T") + "Z";
 const parsed = new Date(input);
 if (Number.isNaN(parsed.getTime())) return "Not recorded";
 const parts = new Intl.DateTimeFormat("en-GB", { timeZone: ist, day:"2-digit", month:"2-digit", year:"numeric", ...(withTime ? { hour:"2-digit", minute:"2-digit", hourCycle:"h23" as const } : {}) }).formatToParts(parsed);
 const part = (key:string) => parts.find(p=>p.type===key)?.value;
 return part("day")+"-"+part("month")+"-"+part("year")+(withTime ? " "+part("hour")+":"+part("minute")+" IST" : "");
}
export const bytes = (v: unknown) => { const n = Number(v || 0); return n >= 1073741824 ? (n / 1073741824).toFixed(2) + " GB" : (n / 1048576).toFixed(2) + " MB"; };
export const time = (v: unknown) => (Number(v || 0) / 60).toFixed(1) + " min";
