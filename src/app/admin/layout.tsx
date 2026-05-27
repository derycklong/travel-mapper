import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function validateToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [prefix, timestamp] = decoded.split(":");
    if (prefix !== "admin") return false;
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime)) return false;
    const now = Date.now();
    return now - tokenTime < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token || !validateToken(token)) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
