import { bytes, time, adminDate } from "@/lib/admin-format";

type UserRow = {
 id: string; name: string; email: string; joined: string | null; lastLogin: string | null;
 documents: number; chats: number; prompts: number; storage: number; active: number; model: string | null;
};
function AccountDate({ value }: { value: string | null }) {
 if (!value) return <span className="text-xs text-muted-foreground">Not recorded</span>;
 const formatted = adminDate(value);
 const [day, clock] = formatted.split(" ");
 return <div className="whitespace-nowrap tabular-nums"><p className="text-sm font-medium">{day}</p><p className="mt-1 text-xs text-muted-foreground">{clock} IST</p></div>;
}
function Identity({ user }: { user: UserRow }) {
 return <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{user.name.trim().charAt(0).toUpperCase() || "U"}</span><div className="min-w-0"><p className="font-medium leading-5">{user.name}</p><p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p></div></div>;
}
function Usage({ user }: { user: UserRow }) {
 return <div><div className="flex gap-4">{[["Docs",user.documents],["Chats",user.chats],["Prompts",user.prompts]].map(([label,n])=><div key={label}><p className="text-sm font-semibold tabular-nums">{n}</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div>)}</div><details className="mt-3 text-xs"><summary className="cursor-pointer text-muted-foreground hover:text-foreground">More details</summary><dl className="mt-2 space-y-2 text-xs"><div><dt className="text-muted-foreground">Top model</dt><dd className="mt-1 break-words">{user.model || "Not recorded"}</dd></div><div><dt className="text-muted-foreground">Username</dt><dd className="mt-1">Not set</dd></div></dl></details></div>;
}
function Storage({ user }: { user: UserRow }) {
 return <div className="whitespace-nowrap"><p className="text-sm font-medium tabular-nums">{bytes(user.storage)}</p><p className="mt-1 text-xs text-muted-foreground">{time(user.active)} active</p></div>;
}
export default function UserDirectory({ users }: { users: UserRow[] }) {
 if (!users.length) return <div className="px-6 py-16 text-center"><h2 className="font-medium">No users found</h2><p className="mt-2 text-sm text-muted-foreground">Try another name or email.</p></div>;
 return <>
 <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{["Account","Usage","Storage & time","Last login","Joined"].map(h=><th scope="col" key={h} className="whitespace-nowrap border-y border-border px-5 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-border">{users.map(user=><tr key={user.id} className="align-top transition-colors hover:bg-muted/20"><td className="min-w-[220px] max-w-[300px] px-5 py-5"><Identity user={user}/></td><td className="min-w-[175px] px-5 py-5"><Usage user={user}/></td><td className="px-5 py-5"><Storage user={user}/></td><td className="min-w-[130px] px-5 py-5"><AccountDate value={user.lastLogin}/></td><td className="min-w-[130px] px-5 py-5"><AccountDate value={user.joined}/></td></tr>)}</tbody></table></div>
 <div className="divide-y divide-border md:hidden">{users.map(user=><article key={user.id} className="space-y-5 p-5"><Identity user={user}/><div className="flex justify-between gap-4"><Usage user={user}/><Storage user={user}/></div><dl className="grid grid-cols-2 gap-4 border-t border-border pt-4"><div><dt className="mb-2 text-xs text-muted-foreground">Last login</dt><dd><AccountDate value={user.lastLogin}/></dd></div><div><dt className="mb-2 text-xs text-muted-foreground">Joined</dt><dd><AccountDate value={user.joined}/></dd></div></dl></article>)}</div>
 </>;
}
