import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hasAdminAccess } from "@/lib/admin-policy";
import { deleteUserData } from "@/lib/delete-user";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function DELETE(req: Request, {params}: {params:Promise<{userId:string}>}) {
 if (req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({error:"Invalid origin"},{status:403});
 const session=await getServerSession(authOptions);
 if (!hasAdminAccess(session?.user,process.env.ADMIN_EMAILS || "")) return NextResponse.json({error:"Forbidden"},{status:403});
 const {userId}=await params;
 if (!/^[a-zA-Z0-9_-]{1,128}$/.test(userId) || userId===session!.user.id) return NextResponse.json({error:"You cannot delete your own admin account."},{status:400});
 try { return NextResponse.json(await deleteUserData(userId,session!.user.id), {headers:{"Cache-Control":"no-store"}}); }
 catch { console.error("Admin user deletion incomplete; account stays disabled and cleanup can be retried."); return NextResponse.json({error:"Deletion incomplete. The account stays disabled. Retry to finish storage, index or subscription cleanup."},{status:503}); }
}
