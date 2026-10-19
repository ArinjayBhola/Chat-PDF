import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { PageHeading } from "@/components/admin/AdminUI";
import { AccessMonitoring } from "@/components/AdminMonitoring";
export default async function AccessPage() {
 if (!await isAdmin("access-logs")) notFound();
 return <><PageHeading title="Access logs" description="Review the latest allowed and denied admin requests. Every admin page checks authorization on the server before querying data."/><AccessMonitoring/></>;
}
