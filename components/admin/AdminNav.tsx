"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [["/admin","Overview"],["/admin/users","Users"],["/admin/documents","Documents"],["/admin/engagement","Engagement"],["/admin/ai","AI usage & errors"],["/admin/access-logs","Access logs"]];
export default function AdminNav() {
 const path=usePathname();
 return <nav aria-label="Admin navigation" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col">{links.map(([href,label])=><Link key={href} href={href} prefetch={false} aria-current={path===href ? "page" : undefined} className={"whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-colors "+(path===href ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>{label}</Link>)}</nav>;
}
