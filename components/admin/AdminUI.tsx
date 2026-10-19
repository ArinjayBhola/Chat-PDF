import type { ReactNode } from "react";
export function Table({ heads, rows }: { heads: string[]; rows: React.ReactNode[][] }) {
 return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{heads.map(h => <th key={h} className="whitespace-nowrap border-b border-border p-3 text-muted-foreground font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border/50">{r.map((c,j) => <td key={j} className="p-3">{c}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="p-6 text-muted-foreground">No data recorded yet.</p>}</div>;
}

export function PageHeading({title,description}: {title:string;description:string}) { return <header className="space-y-2"><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p></header>; }
export function Panel({children}: {children:ReactNode}) { return <section className="rounded-2xl border border-border bg-card p-4 md:p-6 shadow-sm">{children}</section>; }
