import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
export const dynamic = "force-dynamic";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-muted/20 text-foreground"><header className="border-b border-border bg-background"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-5 md:px-8"><div><p className="text-lg font-semibold tracking-tight">ChatDoc <span className="text-primary">Admin</span></p></div><Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-muted"><span aria-hidden="true">&larr;</span> Back to app</Link></div></header><div className="mx-auto grid max-w-[1600px] gap-6 p-5 md:p-8 lg:grid-cols-[210px_minmax(0,1fr)]"><aside><AdminNav /></aside><main className="min-w-0 space-y-6">{children}</main></div></div>;
}
